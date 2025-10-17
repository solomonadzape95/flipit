-- Create a function to update usernames in scores table when user username changes
CREATE OR REPLACE FUNCTION update_scores_username()
RETURNS TRIGGER AS $$
BEGIN
    -- Update all scores for this user with the new username
    UPDATE "Score" 
    SET username = NEW.username 
    WHERE "userId" = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function when user username is updated
CREATE TRIGGER trigger_update_scores_username
    AFTER UPDATE OF username ON "User"
    FOR EACH ROW
    WHEN (OLD.username IS DISTINCT FROM NEW.username)
    EXECUTE FUNCTION update_scores_username();
