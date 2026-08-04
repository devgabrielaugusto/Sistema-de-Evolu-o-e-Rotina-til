-- SQL to run in Supabase SQL Editor
-- Create the tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'todo', -- 'todo', 'in_progress', 'done'
    repetition TEXT NOT NULL DEFAULT 'none', -- 'none', 'daily', 'weekly', 'monthly'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) - Optional but recommended. 
-- For a personal CRM, if you only want authenticated users or just open it up for MVP:
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all actions for anonymous users (for development only, you should secure this later)
CREATE POLICY "Allow all actions for anonymous" ON tasks FOR ALL USING (true);
