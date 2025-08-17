-- Function to activate a user account with a code
create or replace function activate_account_with_code(
    activation_code_to_use text,
    user_id_to_activate uuid,
    user_email_to_set text
)
returns void as $$
declare
    code_id_to_use int;
begin
    -- Find the ID of the provided, unused activation code
    select id into code_id_to_use
    from public.activation_codes
    where code = activation_code_to_use and not is_used;

    -- If no such code is found, raise an exception
    if code_id_to_use is null then
        raise exception 'Code not found or already used';
    end if;

    -- Mark the specific code as used
    update public.activation_codes
    set 
        is_used = true,
        used_by = user_id_to_activate,
        used_by_email = user_email_to_set,
        used_at = now()
    where id = code_id_to_use;

    -- Update the user's profile to Pro
    update public.profiles
    set account_status = 'Pro'
    where id = user_id_to_activate;
end;
$$ language plpgsql security definer;
