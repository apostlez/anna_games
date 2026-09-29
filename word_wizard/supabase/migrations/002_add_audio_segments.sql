alter table public.words
  add column if not exists source_audio_url text,
  add column if not exists audio_start numeric,
  add column if not exists audio_end numeric;

alter table public.words
  add constraint words_audio_segment_order_check
  check (
    (audio_start is null and audio_end is null)
    or (audio_start >= 0 and audio_end > audio_start)
  );
