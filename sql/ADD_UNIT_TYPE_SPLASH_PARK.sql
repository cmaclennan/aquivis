-- Add new unit_type value 'splash_park' if it doesn't already exist
do $$
begin
  if not exists (select 1 from pg_type t join pg_enum e on t.oid = e.enumtypid where t.typname = 'unit_type' and e.enumlabel = 'splash_park') then
    alter type unit_type add value 'splash_park';
  end if;
end$$;






