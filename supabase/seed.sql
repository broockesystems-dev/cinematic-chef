-- Local/dev seed: three sample dishes on three continents.
-- Fixed UUIDs keep links stable across `supabase db reset`.

-- ---------------------------------------------------------------------------
-- Locations
-- ---------------------------------------------------------------------------
insert into public.locations (id, parent_id, type, name, slug, lat, lng, iso_code) values
  ('10000000-0000-0000-0000-000000000001', null, 'continent', '{"pt": "Europa", "en": "Europe"}', 'europe', 50.0, 15.0, null),
  ('10000000-0000-0000-0000-000000000002', null, 'continent', '{"pt": "América do Norte", "en": "North America"}', 'north-america', 45.0, -100.0, null),
  ('10000000-0000-0000-0000-000000000003', null, 'continent', '{"pt": "América do Sul", "en": "South America"}', 'south-america', -15.0, -60.0, null);

insert into public.locations (id, parent_id, type, name, slug, lat, lng, iso_code) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'country', '{"pt": "Itália", "en": "Italy"}', 'italy', 42.5, 12.5, 'IT'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'country', '{"pt": "México", "en": "Mexico"}', 'mexico', 23.6, -102.5, 'MX'),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'country', '{"pt": "Brasil", "en": "Brazil"}', 'brazil', -14.2, -51.9, 'BR');

insert into public.locations (id, parent_id, type, name, slug, lat, lng) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'city', '{"pt": "Nápoles", "en": "Naples"}', 'naples', 40.8518, 14.2681),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'city', '{"pt": "Cidade do México", "en": "Mexico City"}', 'mexico-city', 19.4326, -99.1332),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'city', '{"pt": "Belo Horizonte", "en": "Belo Horizonte"}', 'belo-horizonte', -19.9167, -43.9345);

insert into public.locations (id, parent_id, type, name, slug, lat, lng) values
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'neighborhood', '{"pt": "Centro Histórico", "en": "Historic Centre"}', 'centro-storico', 40.8506, 14.2586);

-- ---------------------------------------------------------------------------
-- Dishes
-- ---------------------------------------------------------------------------
insert into public.dishes
  (id, location_id, slug, name, story, prep_minutes, difficulty, base_servings, access, status, published_at)
values
  (
    '50000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    'pizza-fritta',
    '{"pt": "Pizza fritta", "en": "Pizza fritta"}',
    '{"pt": "Nascida nos becos de Nápoles no pós-guerra, quando os fornos a lenha estavam destruídos e a farinha era escassa, a pizza fritta era vendida por mulheres na porta de casa e paga, muitas vezes, só oito dias depois. Massa de pizza recheada com ricota, provola e torresmo, dobrada ao meio e frita até dourar: comida de rua que alimentou uma cidade inteira.", "en": "Born in the alleys of post-war Naples, when wood-fired ovens lay in ruins and flour was scarce, pizza fritta was sold by women from their doorsteps and often paid for a week later. Pizza dough filled with ricotta, provola and pork cracklings, folded in half and fried until golden: street food that fed an entire city."}',
    180, 'medium', 4, 'free', 'published', now()
  ),
  (
    '50000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000002',
    'tacos-al-pastor',
    '{"pt": "Tacos al pastor", "en": "Tacos al pastor"}',
    '{"pt": "Imigrantes libaneses trouxeram o shawarma para o México no começo do século XX. Na Cidade do México, o cordeiro virou porco, o tempero ganhou chiles e achiote, e o espeto vertical — o trompo — ganhou um abacaxi no topo. O resultado é o taco mais famoso da capital, servido de madrugada em cada esquina.", "en": "Lebanese immigrants brought shawarma to Mexico in the early 20th century. In Mexico City, lamb became pork, the marinade picked up chiles and achiote, and the vertical spit — the trompo — gained a pineapple on top. The result is the capital''s most famous taco, served late at night on every corner."}',
    300, 'medium', 6, 'free', 'published', now()
  ),
  (
    '50000000-0000-0000-0000-000000000003',
    '30000000-0000-0000-0000-000000000003',
    'pao-de-queijo',
    '{"pt": "Pão de queijo", "en": "Brazilian cheese bread"}',
    '{"pt": "Nas fazendas de Minas Gerais do século XVIII, a farinha de trigo era cara e rara, mas a mandioca sobrava. As cozinheiras escravizadas aproveitavam o polvilho que ficava no fundo da água da mandioca, somavam ovos, leite e queijo curado da própria fazenda, e assim nasceu o pão de queijo: casquinha crocante, miolo elástico, presença obrigatória no café mineiro.", "en": "On 18th-century farms in Minas Gerais, wheat flour was rare and expensive, but cassava was everywhere. Enslaved cooks used the starch that settled at the bottom of cassava water, added eggs, milk and the farm''s own aged cheese, and pão de queijo was born: a crisp shell, a stretchy center, and a fixture of every Minas breakfast table."}',
    60, 'easy', 6, 'premium', 'published', now()
  );

-- ---------------------------------------------------------------------------
-- Ingredients
-- ---------------------------------------------------------------------------
insert into public.ingredients (dish_id, position, name, qty_metric, unit_metric, qty_us, unit_us, note) values
  -- Pizza fritta
  ('50000000-0000-0000-0000-000000000001', 0, '{"pt": "Farinha tipo 00", "en": "Tipo 00 flour"}', 500, 'g', 4, 'cup', null),
  ('50000000-0000-0000-0000-000000000001', 1, '{"pt": "Água morna", "en": "Lukewarm water"}', 325, 'ml', 1.33, 'cup', null),
  ('50000000-0000-0000-0000-000000000001', 2, '{"pt": "Fermento biológico seco", "en": "Active dry yeast"}', 3, 'g', 1, 'tsp', null),
  ('50000000-0000-0000-0000-000000000001', 3, '{"pt": "Sal", "en": "Salt"}', 12, 'g', 2, 'tsp', null),
  ('50000000-0000-0000-0000-000000000001', 4, '{"pt": "Ricota fresca", "en": "Fresh ricotta"}', 250, 'g', 1, 'cup', '{"pt": "bem escorrida", "en": "well drained"}'),
  ('50000000-0000-0000-0000-000000000001', 5, '{"pt": "Provola defumada", "en": "Smoked provola"}', 200, 'g', 7, 'oz', '{"pt": "em cubos pequenos; pode usar muçarela defumada", "en": "small cubes; smoked mozzarella works too"}'),
  ('50000000-0000-0000-0000-000000000001', 6, '{"pt": "Cicoli (torresmo napolitano)", "en": "Cicoli (Neapolitan pork cracklings)"}', 100, 'g', 3.5, 'oz', '{"pt": "ou salame napolitano picado", "en": "or chopped Neapolitan salami"}'),
  ('50000000-0000-0000-0000-000000000001', 7, '{"pt": "Pimenta-do-reino moída na hora", "en": "Freshly ground black pepper"}', null, null, null, null, '{"pt": "a gosto", "en": "to taste"}'),
  ('50000000-0000-0000-0000-000000000001', 8, '{"pt": "Óleo de amendoim para fritar", "en": "Peanut oil, for frying"}', 1.5, 'l', 6, 'cup', null),
  -- Tacos al pastor
  ('50000000-0000-0000-0000-000000000002', 0, '{"pt": "Paleta de porco em fatias finas", "en": "Pork shoulder, thinly sliced"}', 1, 'kg', 2.2, 'lb', null),
  ('50000000-0000-0000-0000-000000000002', 1, '{"pt": "Chile guajillo seco", "en": "Dried guajillo chiles"}', 4, 'unit', 4, 'unit', '{"pt": "sem sementes", "en": "seeded"}'),
  ('50000000-0000-0000-0000-000000000002', 2, '{"pt": "Chile ancho seco", "en": "Dried ancho chiles"}', 2, 'unit', 2, 'unit', '{"pt": "sem sementes", "en": "seeded"}'),
  ('50000000-0000-0000-0000-000000000002', 3, '{"pt": "Pasta de achiote (urucum)", "en": "Achiote paste"}', 50, 'g', 1.75, 'oz', null),
  ('50000000-0000-0000-0000-000000000002', 4, '{"pt": "Suco de abacaxi", "en": "Pineapple juice"}', 120, 'ml', 0.5, 'cup', null),
  ('50000000-0000-0000-0000-000000000002', 5, '{"pt": "Vinagre branco", "en": "White vinegar"}', 60, 'ml', 0.25, 'cup', null),
  ('50000000-0000-0000-0000-000000000002', 6, '{"pt": "Alho", "en": "Garlic"}', 4, 'clove', 4, 'clove', null),
  ('50000000-0000-0000-0000-000000000002', 7, '{"pt": "Orégano mexicano seco", "en": "Dried Mexican oregano"}', 1, 'tsp', 1, 'tsp', null),
  ('50000000-0000-0000-0000-000000000002', 8, '{"pt": "Cominho em pó", "en": "Ground cumin"}', 0.5, 'tsp', 0.5, 'tsp', null),
  ('50000000-0000-0000-0000-000000000002', 9, '{"pt": "Sal", "en": "Salt"}', 10, 'g', 2, 'tsp', null),
  ('50000000-0000-0000-0000-000000000002', 10, '{"pt": "Abacaxi", "en": "Pineapple"}', 0.5, 'unit', 0.5, 'unit', '{"pt": "em fatias", "en": "sliced"}'),
  ('50000000-0000-0000-0000-000000000002', 11, '{"pt": "Tortilhas de milho pequenas", "en": "Small corn tortillas"}', 18, 'unit', 18, 'unit', null),
  ('50000000-0000-0000-0000-000000000002', 12, '{"pt": "Cebola branca picada", "en": "White onion, finely chopped"}', 1, 'unit', 1, 'unit', null),
  ('50000000-0000-0000-0000-000000000002', 13, '{"pt": "Coentro picado", "en": "Chopped cilantro"}', 1, 'bunch', 1, 'bunch', null),
  ('50000000-0000-0000-0000-000000000002', 14, '{"pt": "Limão", "en": "Limes"}', 3, 'unit', 3, 'unit', '{"pt": "em gomos", "en": "cut into wedges"}'),
  -- Pão de queijo
  ('50000000-0000-0000-0000-000000000003', 0, '{"pt": "Polvilho azedo", "en": "Sour cassava starch (polvilho azedo)"}', 500, 'g', 4, 'cup', null),
  ('50000000-0000-0000-0000-000000000003', 1, '{"pt": "Leite", "en": "Whole milk"}', 250, 'ml', 1, 'cup', null),
  ('50000000-0000-0000-0000-000000000003', 2, '{"pt": "Água", "en": "Water"}', 120, 'ml', 0.5, 'cup', null),
  ('50000000-0000-0000-0000-000000000003', 3, '{"pt": "Óleo", "en": "Vegetable oil"}', 120, 'ml', 0.5, 'cup', null),
  ('50000000-0000-0000-0000-000000000003', 4, '{"pt": "Sal", "en": "Salt"}', 10, 'g', 2, 'tsp', null),
  ('50000000-0000-0000-0000-000000000003', 5, '{"pt": "Ovos", "en": "Eggs"}', 3, 'unit', 3, 'unit', '{"pt": "em temperatura ambiente", "en": "at room temperature"}'),
  ('50000000-0000-0000-0000-000000000003', 6, '{"pt": "Queijo minas meia-cura ralado", "en": "Grated semi-aged Minas cheese"}', 250, 'g', 9, 'oz', '{"pt": "ou metade parmesão, metade meia-cura", "en": "or half Parmesan, half Monterey Jack"}');

-- ---------------------------------------------------------------------------
-- Steps
-- ---------------------------------------------------------------------------
insert into public.steps (dish_id, position, title, text, timer_seconds) values
  -- Pizza fritta
  ('50000000-0000-0000-0000-000000000001', 0, '{"pt": "Massa", "en": "Dough"}', '{"pt": "Dissolva o fermento na água morna. Junte a farinha aos poucos e, por último, o sal. Sove até a massa ficar lisa e elástica.", "en": "Dissolve the yeast in the lukewarm water. Add the flour gradually and the salt last. Knead until the dough is smooth and elastic."}', 600),
  ('50000000-0000-0000-0000-000000000001', 1, '{"pt": "Primeira fermentação", "en": "First rise"}', '{"pt": "Cubra a massa com um pano e deixe crescer em local morno até dobrar de volume.", "en": "Cover the dough with a cloth and let it rise somewhere warm until doubled in size."}', 7200),
  ('50000000-0000-0000-0000-000000000001', 2, '{"pt": "Bolinhas", "en": "Portioning"}', '{"pt": "Divida a massa em 4 bolas iguais, boleie bem e deixe descansar cobertas.", "en": "Divide the dough into 4 equal balls, shape them tightly and let them rest, covered."}', 1800),
  ('50000000-0000-0000-0000-000000000001', 3, '{"pt": "Recheio", "en": "Filling"}', '{"pt": "Misture a ricota com a provola, os cicoli e pimenta-do-reino a gosto.", "en": "Mix the ricotta with the provola, the cicoli and black pepper to taste."}', null),
  ('50000000-0000-0000-0000-000000000001', 4, '{"pt": "Montagem", "en": "Assembly"}', '{"pt": "Abra cada bola com as mãos num disco de uns 25 cm. Coloque o recheio em uma metade, dobre em meia-lua e aperte bem as bordas para selar.", "en": "Stretch each ball by hand into a disc about 10 inches wide. Spoon the filling onto one half, fold into a half-moon and press the edges firmly to seal."}', null),
  ('50000000-0000-0000-0000-000000000001', 5, '{"pt": "Fritura", "en": "Frying"}', '{"pt": "Aqueça o óleo a 175 °C. Frite uma pizza por vez, regando a parte de cima com óleo, e vire na metade do tempo até dourar dos dois lados.", "en": "Heat the oil to 350 °F. Fry one pizza at a time, spooning oil over the top, and flip halfway through until golden on both sides."}', 240),
  ('50000000-0000-0000-0000-000000000001', 6, '{"pt": "Servir", "en": "Serve"}', '{"pt": "Escorra em papel-toalha e sirva na hora, bem quente.", "en": "Drain on paper towels and serve right away, piping hot."}', null),
  -- Tacos al pastor
  ('50000000-0000-0000-0000-000000000002', 0, '{"pt": "Chiles", "en": "Chiles"}', '{"pt": "Toste os chiles numa frigideira seca por alguns segundos de cada lado e deixe de molho em água quente até amolecerem.", "en": "Toast the chiles in a dry skillet for a few seconds per side, then soak them in hot water until soft."}', 900),
  ('50000000-0000-0000-0000-000000000002', 1, '{"pt": "Marinada", "en": "Marinade"}', '{"pt": "Bata no liquidificador os chiles escorridos com o achiote, o suco de abacaxi, o vinagre, o alho, o orégano, o cominho e o sal até virar uma pasta lisa.", "en": "Blend the drained chiles with the achiote, pineapple juice, vinegar, garlic, oregano, cumin and salt into a smooth paste."}', null),
  ('50000000-0000-0000-0000-000000000002', 2, '{"pt": "Marinar", "en": "Marinate"}', '{"pt": "Cubra todas as fatias de porco com a marinada e leve à geladeira por pelo menos 4 horas (o ideal é de um dia para o outro).", "en": "Coat every slice of pork in the marinade and refrigerate for at least 4 hours (overnight is best)."}', null),
  ('50000000-0000-0000-0000-000000000002', 3, '{"pt": "Selar a carne", "en": "Sear the pork"}', '{"pt": "Aqueça uma frigideira de ferro até soltar fumaça. Sele a carne em levas, sem amontoar, até caramelizar nas bordas. Depois pique fino.", "en": "Heat a cast-iron skillet until smoking. Sear the pork in batches, without crowding, until the edges caramelize. Then chop it finely."}', 240),
  ('50000000-0000-0000-0000-000000000002', 4, '{"pt": "Abacaxi", "en": "Pineapple"}', '{"pt": "Na mesma frigideira, doure as fatias de abacaxi dos dois lados e corte em cubinhos.", "en": "In the same skillet, char the pineapple slices on both sides and dice them."}', 240),
  ('50000000-0000-0000-0000-000000000002', 5, '{"pt": "Montar", "en": "Assemble"}', '{"pt": "Aqueça as tortilhas, recheie com a carne e finalize com cebola, coentro, abacaxi e um gomo de limão.", "en": "Warm the tortillas, fill them with the pork and top with onion, cilantro, pineapple and a squeeze of lime."}', null),
  -- Pão de queijo
  ('50000000-0000-0000-0000-000000000003', 0, '{"pt": "Escaldar", "en": "Scald the starch"}', '{"pt": "Ferva o leite, a água, o óleo e o sal. Despeje sobre o polvilho e mexa até formar uma massa grudenta e sem grumos.", "en": "Bring the milk, water, oil and salt to a boil. Pour it over the starch and stir until you get a sticky, lump-free dough."}', null),
  ('50000000-0000-0000-0000-000000000003', 1, '{"pt": "Esfriar", "en": "Cool down"}', '{"pt": "Deixe a massa amornar para os ovos não cozinharem.", "en": "Let the dough cool until warm so the eggs don''t cook."}', 600),
  ('50000000-0000-0000-0000-000000000003', 2, '{"pt": "Ovos", "en": "Eggs"}', '{"pt": "Acrescente os ovos um a um, sovando bem a cada adição.", "en": "Add the eggs one at a time, kneading well after each."}', null),
  ('50000000-0000-0000-0000-000000000003', 3, '{"pt": "Queijo", "en": "Cheese"}', '{"pt": "Junte o queijo e sove até a massa ficar lisa e desgrudar das mãos.", "en": "Add the cheese and knead until the dough is smooth and no longer sticks to your hands."}', null),
  ('50000000-0000-0000-0000-000000000003', 4, '{"pt": "Bolear", "en": "Shape"}', '{"pt": "Preaqueça o forno a 180 °C. Com as mãos untadas, faça bolinhas de uns 3 cm e disponha numa assadeira com espaço entre elas.", "en": "Preheat the oven to 350 °F. With oiled hands, roll 1¼-inch balls and space them out on a baking sheet."}', null),
  ('50000000-0000-0000-0000-000000000003', 5, '{"pt": "Assar", "en": "Bake"}', '{"pt": "Asse até crescerem e dourarem por baixo. Sirva quente.", "en": "Bake until puffed and golden underneath. Serve warm."}', 1800);

-- ---------------------------------------------------------------------------
-- Next-destination vote (open for the current month in local dev)
-- ---------------------------------------------------------------------------
insert into public.polls (id, month, status, closes_at) values
  ('80000000-0000-0000-0000-000000000001', date_trunc('month', now())::date, 'open', date_trunc('month', now()) + interval '1 month' - interval '1 second');

insert into public.poll_options (poll_id, position, dish_name, description) values
  ('80000000-0000-0000-0000-000000000001', 0, '{"pt": "Ramen de Tóquio", "en": "Tokyo ramen"}', '{"pt": "Caldo de horas, macarrão fresco e o ritual das casas de ramen do Japão.", "en": "Hours-long broth, fresh noodles and the ritual of Japan''s ramen shops."}'),
  ('80000000-0000-0000-0000-000000000001', 1, '{"pt": "Khachapuri da Geórgia", "en": "Georgian khachapuri"}', '{"pt": "O pão em forma de barco com queijo derretido e gema, direto de Tbilisi.", "en": "The boat-shaped bread with molten cheese and egg yolk, straight from Tbilisi."}'),
  ('80000000-0000-0000-0000-000000000001', 2, '{"pt": "Moqueca capixaba", "en": "Moqueca from Espírito Santo"}', '{"pt": "Peixe cozido na panela de barro, com urucum e sem dendê.", "en": "Fish stewed in a clay pot with annatto and no palm oil."}');

-- ---------------------------------------------------------------------------
-- One-off trip
-- ---------------------------------------------------------------------------
insert into public.bundles (id, slug, name, description, price_brl, price_usd, status) values
  ('90000000-0000-0000-0000-000000000001', 'volta-ao-mundo',
   '{"pt": "Volta ao mundo em 3 pratos", "en": "Around the world in 3 dishes"}',
   '{"pt": "De Nápoles a Belo Horizonte, passando pela Cidade do México: três clássicos de rua para cozinhar em um fim de semana.", "en": "From Naples to Belo Horizonte by way of Mexico City: three street-food classics to cook over a weekend."}',
   2900, 900, 'published');
insert into public.bundle_dishes (bundle_id, dish_id, position) values
  ('90000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 0),
  ('90000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002', 1),
  ('90000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000003', 2);
