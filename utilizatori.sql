CREATE TYPE roluri AS ENUM('admin', 'moderator', 'comun');
--vei mai avea de produs un rol: ex admin produse, care modifica si adauga produse

CREATE TABLE IF NOT EXISTS utilizatori (
   id serial PRIMARY KEY,
   username VARCHAR(50) UNIQUE NOT NULL,
   nume VARCHAR(100) NOT NULL,
   prenume VARCHAR(100) NOT NULL,
   parola VARCHAR(500) NOT NULL, --500 de caractere pt ca va fi criptata
   rol roluri NOT NULL DEFAULT 'comun',
   email VARCHAR(100) NOT NULL,
   culoare_chat VARCHAR(50) NOT NULL,
   data_adaugare TIMESTAMP DEFAULT current_timestamp,
   cod character varying(200), 
   -- generam un cod pt confirmarea utilizatorului (pus in link-ul de confirmare)
   confirmat_mail boolean DEFAULT false,
   poza VARCHAR(200)
);

CREATE TABLE IF NOT EXISTS accesari (
   id serial PRIMARY KEY,
   ip VARCHAR(100) NOT NULL,
   user_id INT NULL REFERENCES utilizatori(id),
   pagina VARCHAR(500) NOT NULL,
   data_accesare TIMESTAMP DEFAULT current_timestamp
);

-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO david;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO david;
