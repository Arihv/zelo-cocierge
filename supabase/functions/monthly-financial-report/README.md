# Relatório financeiro mensal

Esta função envia para `zeloconciergeria@gmail.com` um resumo e uma planilha CSV dos pedidos aprovados pelo Mercado Pago no mês anterior. Chamados de manutenção são excluídos.

## Secrets necessários

No Supabase, em **Edge Functions → Secrets**, crie:

- `RESEND_API_KEY`: uma API key de envio criada no Resend.
- `MONTHLY_FINANCIAL_REPORT_CRON_SECRET`: uma senha aleatória longa, usada também na tarefa agendada.
- `FINANCIAL_REPORT_EMAIL` (opcional): destinatário do relatório. Se não existir, a função usa `zeloconciergeria@gmail.com`.

## Publicação e teste

No terminal do projeto:

```powershell
supabase functions deploy monthly-financial-report --project-ref nnaracxxxtbqshcwusdq
```

Para testar uma única vez um mês específico, troque os valores abaixo e execute:

```powershell
Invoke-RestMethod -Method Post `
  -Uri "https://nnaracxxxtbqshcwusdq.supabase.co/functions/v1/monthly-financial-report?month=2026-08" `
  -Headers @{ "x-cron-secret" = "O_MESMO_SEGREDO_CADASTRADO" }
```

## Agendamento mensal

Depois de publicar e testar, execute **uma única vez** no SQL Editor do Supabase, trocando o texto do segredo pelo mesmo valor salvo em Edge Functions → Secrets:

```sql
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select vault.create_secret(
  'COLE_O_MESMO_SEGREDO_AQUI',
  'MONTHLY_FINANCIAL_REPORT_CRON_SECRET',
  'Autorização do relatório financeiro mensal da Zelo'
);

select cron.schedule(
  'zelo-monthly-financial-report',
  '10 5 1 * *',
  $$
  select net.http_post(
    url := 'https://nnaracxxxtbqshcwusdq.supabase.co/functions/v1/monthly-financial-report',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'MONTHLY_FINANCIAL_REPORT_CRON_SECRET')
    ),
    body := '{}'::jsonb
  );
  $$
);
```

O horário `10 5 1 * *` é 05:10 UTC, aproximadamente 02:10 no horário de Brasília, no primeiro dia de cada mês. O relatório enviado é o do mês anterior.
