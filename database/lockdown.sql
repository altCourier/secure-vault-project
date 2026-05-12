-- Written by altCourier

/* 

Syntax of CREATE TRIGGER... ON...

CREATE [ OR ALTER ] TRIGGER [ schema_name . ] trigger_name
ON { table | view }
[ WITH <dml_trigger_option> [ , ...n ] ]
{ FOR | AFTER | INSTEAD OF }
{ [ INSERT ] [ , ] [ UPDATE ] [ , ] [ DELETE ] }
[ WITH APPEND ]
[ NOT FOR REPLICATION ]
AS { sql_statement  [ ; ] [ , ...n ] | EXTERNAL NAME <method_specifier [ ; ] > }

In this syntax, [ ] means that it is optional.
                { } means that it is a required choice. 

The line "{ [ INSERT ] [ , ] [ UPDATE ] [ , ] [ DELETE ] }" is
a bit of quirk as it is a bit intersting.

As [] means optional and {} means it is required we can translate
this phrase as it is required to pick at least one inside this.

Therefore even the commas are a pick.

Thus, it should have been possible to write
AFTER ,
or
AFTER ,,
But of course, it is not possible.
Similiarly this should be valid according to the given documentation:
AFTER INSERT ,
But this is also not valid for the SQL.

If we had wanted to write the syntax according to the correct math:

{ INSERT | UPDATE | DELETE | INSERT, UPDATE | INSERT, DELETE 
| UPDATE, DELETE | INSERT, UPDATE, DELETE }

which is long and tedious.

Therefore we can reach the conclusion that this kind of syntax should
not be perceived as mathematical statements but as a shortcut.

*/

-- New log entry is a failure
CREATE TRIGGER failed_entry
AFTER INSERT ON Audit_Log

/*

FOR EACH ROW variable_name in database_name.table_name
 [ WHERE condition ]
BEGIN
   action_command_list;
END;

*/

FOR EACH ROW
BEGIN

    IF NEW.status = 'failure' THEN

        UPDATE Security_State
        SET consecutive_failures = consecutive_failures + 1,
            last_failed_at = NOW()

        WHERE user_id = NEW.user_id;

        SELECT consecutive_failures INTO @failures
        FROM Security_State
        WHERE user_id = NEW.user_id;

        IF @failures >= 5 THEN

            UPDATE Security_State
            SET is_account_frozen = TRUE,
                lockout_until = DATE_ADD(NOW(), INTERVAL 30 MINUTE)
            WHERE user_id = NEW.user_id;

        END IF;

    END IF;

    IF NEW.status = 'success' THEN

        UPDATE Security_State
        SET consecutive_failures = 0,
            lockout_until = NULL,
            is_account_frozen = FALSE
        WHERE user_id = NEW.user_id;

    END IF;

END;


/*

For further references check:

- https://www.ibm.com/docs/en/netcoolomnibus/8.1.0?topic=reference-each-row-statement
- https://learn.microsoft.com/en-us/sql/t-sql/statements/create-trigger-transact-sql?view=sql-server-ver17
- https://learn.microsoft.com/en-us/sql/t-sql/language-elements/begin-end-transact-sql?view=sql-server-ver17

NEW keyword:
- https://dev.mysql.com/doc/refman/5.7/en/trigger-syntax.html
- https://stackoverflow.com/questions/2762851/increment-a-database-field-by-1

Date related:
- https://www.w3schools.com/sql/func_mysql_date_add.asp

User defined variables (@failures)
- https://dev.mysql.com/doc/refman/9.7/en/user-variables.html

*/