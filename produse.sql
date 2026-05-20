--id
--nume
--descriere
--cale imagine
--pret

--categ mare :Mirrorless, dSLR, Bridge, etc
--categ 2: marime senzor
--car numerica: rezolutie senzor
--data: data inserare in bd 
	--(ar avea mai mult sens release date but I don't wanna deal with that)
--caract cu o singura valoare: brand 
--val multiple: porturi/conectivitate
--bool: IBIS

create type tipuri_cam as enum(
	'Mirrorless',
	'dSLR',
	'Bridge',
	'Compact'
);

create type tipuri_sen as enum(
	'Full Frame',
	'APS-C',
	'MFT',
	'1-inch',
	'2/3',
	'1/1.7',
	'1/2.3'
);

drop table if exists camere;

create table camere (
	id serial PRIMARY KEY,
	nume varchar(64) UNIQUE NOT NULL,
	descriere TEXT,
	pret numeric(8,2) NOT NULL,
	rezolutie int NOT NULL CHECK (rezolutie>0), --caract numerica
	tip_cam tipuri_cam NOT NULL, --categ mare
	marime_senzor tipuri_sen NOT NULL, --categ mica
	brand varchar(64) NOT NULL,
	conectivitate VARCHAR [],
	IBIS boolean NOT NULL DEFAULT FALSE,
	imagine VARCHAR(300),
	data_lansare date	
);
--Canon 5dIV, canon 1300d, canon ixus60, canon R6, 
-- fujifilm X100, fuji XE-3, fuji XT, olympus OM-D, sony A7III

INSERT INTO camere (nume, descriere, pret, rezolutie, tip_cam, marime_senzor, brand, conectivitate, IBIS, imagine, data_lansare) VALUES
('Canon EOS 5D Mark IV', 'Camera dSLR profesionala de inalta performanta', 17500, 30, 'dSLR', 'Full Frame', 'Canon', '{"card CF", "card SDXC", "USB 3.0", "mini-HDMI", "Microfon", "Casti"}', FALSE, 'canon5dmk4.jpg', '2016-aug-25'),
('Canon EOS 1300D', 'Camera dSLR entry-level', 2750, 18, 'dSLR', 'APS-C', 'Canon', '{"card SDXC", "USB 2.0", "mini-HDMI"}', FALSE, 'canon-1300d.jpg', '2016-mar-10'),
('Canon IXUS 60', 'Camera compacta potrivita pentru turism', 560, 6, 'Compact', '1/2.3', 'Canon', '{"card SD", "USB 2.0"}', FALSE, 'canon-ixus60.jpg', '2006-feb-21'),
('Canon R6', 'Camera Mirrorless semi-profesionala', 12500, 20, 'Mirrorless', 'Full Frame', 'Canon', '{"2 carduri SDXC", "USB 3.2 gen 2", "Micro-HDMI", "Microfon", "Casti"}', TRUE, 'canonr6.jpg', '2020-jul-9'),
('Fujifilm X100', 'Camera premium-compact cu senzor mare', 3000, 12, 'Compact', 'APS-C', 'Fujifilm', '{"Card SDXC", "USB 2.0", "Mini-HDMI"}', FALSE, 'fuji-x100.jpg', '2010-sep-19'),
('Fujifilm XE-3', 'Mirrorless cu profil mic', 5000, 24, 'Mirrorless', 'APS-C', 'Fujifilm', '{"Card SDXC", "USB 2.0", "Micro-HDMI"}', FALSE, 'fuji-xe3.jpg', '2017-sep-7'),
('Fujifilm XT-5', 'Noul varf de gama de la Fujifilm', 8000, 40, 'Mirrorless', 'APS-C', 'Fujifilm', '{"2 carduri SDXC UHS-II", "USB 3.2 gen 2", "HDMI micro tip D", "Microfon", "Wireless"}', TRUE, 'fuji-xta.jpg', '2022-nov-2'),
('Olympus OM-D E-M10 IV', 'Mirrorless compact cu senzor mic', 3500, 22, 'Mirrorless', 'MFT', 'Olympus', '{"card SDXC UHS-II", "USB 2.0", "micro-HDMI"}', FALSE, 'olympus-omd.jpg', '2020-aug-4'),
('Sony A7 III', 'Mirrorless de inalta performanta de la Sony', 10000, 24, 'Mirrorless', 'Full Frame', 'Sony', '{"Card SDXC", "Memory Stick", "USB 3.2 gen 1", "micro-HDMI", "Microfon", "Casti"}', TRUE, 'sony-a73.jpg', '2018-feb-27')
;

select * from camere;