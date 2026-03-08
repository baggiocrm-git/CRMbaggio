-- Add info column to contatos table
ALTER TABLE contatos ADD COLUMN IF NOT EXISTS info TEXT;
