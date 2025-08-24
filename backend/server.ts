import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

app.post('/api/launches', async (req, res) => {
    const {
        angle,
        distance,
        max_height,
        velocity,
        force,
        acceleration,
        pressure,
        mass
    } = req.body;

    if (angle === undefined || distance === undefined || max_height === undefined) {
        return res.status(400).json({ error: 'Dados essenciais incompletos.' });
    }

    const name = `grafico_trajetoria_foguete-${new Date().toISOString()}`;

    const { data, error } = await supabase
        .from('launches')
        .insert([{
            name,
            angle,
            distance,
            max_height,
            velocity,
            force,
            acceleration,
            pressure,
            mass
        }]);

    if (error) {
        console.error('Erro ao salvar no Supabase:', error);
        return res.status(500).json({ error: 'Falha ao salvar o lançamento.' });
    }
    res.status(201).json(data);
});

app.get('/api/launches', async (req, res) => {
    const { data, error } = await supabase
        .from('launches')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) {
        console.error('Erro ao buscar no Supabase:', error);
        return res.status(500).json({ error: 'Falha ao buscar o histórico.' });
    }
    res.status(200).json(data);
});

app.delete('/api/launches/:id', async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase
        .from('launches')
        .delete()
        .match({ id: id });
    if (error) {
        console.error('Erro ao apagar no Supabase:', error);
        return res.status(500).json({ error: 'Falha ao apagar o lançamento.' });
    }
    res.status(200).json({ message: 'Lançamento apagado com sucesso.' });
});

app.get('/api/database/status', async (req, res) => {
    const { data, error } = await supabase.rpc('get_database_size');
    if (error) {
        console.error('Erro ao buscar tamanho do DB:', error);
        return res.status(500).json({ error: 'Falha ao verificar o status do banco de dados.' });
    }
    const dbSizeInBytes = data;
    const dbSizeLimitBytes = 500 * 1024 * 1024;
    const usagePercentage = (dbSizeInBytes / dbSizeLimitBytes) * 100;
    let status = 'ok';
    if (usagePercentage > 90) {
        status = 'quase cheio';
    }
    res.status(200).json({
        size_bytes: dbSizeInBytes,
        limit_bytes: dbSizeLimitBytes,
        usage_percentage: usagePercentage.toFixed(2),
        status: status
    });
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});