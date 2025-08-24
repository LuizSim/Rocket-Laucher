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
    const { angle, distance, max_height } = req.body;

    if (!angle || !distance || !max_height) {
        return res.status(400).json({ error: 'Dados incompletos.' });
    }

    const name = `grafico_trajetoria_foguete-${new Date().toISOString()}`;

    const { data, error } = await supabase
        .from('launches')
        .insert([{ name, angle, distance, max_height }]);

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

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});