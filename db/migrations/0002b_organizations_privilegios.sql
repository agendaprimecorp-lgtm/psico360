-- Criar e apagar organizacao sao atos de plataforma, feitos pelo papel dono
-- (ver scripts/preparar-neon.mjs). O papel da aplicacao nunca faz nenhum dos
-- dois. Alem de nao serem desejados, esses privilegios sequer funcionariam: a
-- politica de 0002 nao declara clausula FOR, entao seu USING vale tambem como
-- WITH CHECK em INSERT, e o id de uma organizacao nova vem de
-- gen_random_uuid() — nunca coincidiria com app.organization_id.
--
-- Sobram select e update: a organizacao le e edita os proprios dados.
revoke insert, delete on organizations from psico360_app;
