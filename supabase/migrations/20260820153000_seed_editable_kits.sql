-- Kits passam a fazer parte do catálogo administrável, com preço único e edição pela administração.
INSERT INTO public.service_catalog (key, name, description, category, audience, price_by_property, unit, icon, sort_order)
VALUES
  ('kit_cafe_individual', 'Kit Individual', '1 pessoa\n• Pão\n• Café\n• Açúcar\n• Manteiga\n• Ovos', 'kit', 'guest', false, 'kit', 'coffee', 20),
  ('kit_cafe_casal', 'Kit Casal', '2 pessoas\n• Pão\n• Café\n• Açúcar\n• Manteiga\n• Ovos\n• Queijo', 'kit', 'guest', false, 'kit', 'coffee', 21),
  ('kit_cafe_familia', 'Kit Família', '4 pessoas\n• Pães\n• Café\n• Ovos\n• Queijo\n• Presunto', 'kit', 'guest', false, 'kit', 'coffee', 22),
  ('kit_refeicao_basico', 'Kit Refeição Básico', '1 a 2 pessoas\n• Macarrão\n• Molho bolonhesa\n• Queijo ralado', 'kit', 'guest', false, 'kit', 'utensils', 23),
  ('kit_refeicao_completo', 'Kit Refeição Completo', '2 a 3 pessoas\n• Macarrão\n• Molho bolonhesa\n• Queijo ralado\n• Bebida', 'kit', 'guest', false, 'kit', 'utensils', 24)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.pricing (service_key, property_type, price)
VALUES
  ('kit_cafe_individual', NULL, 49.90),
  ('kit_cafe_casal', NULL, 89.90),
  ('kit_cafe_familia', NULL, 159.90),
  ('kit_refeicao_basico', NULL, 59.90),
  ('kit_refeicao_completo', NULL, 74.00)
ON CONFLICT DO NOTHING;
