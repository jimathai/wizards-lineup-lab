# Feedback email autofill

Replace:

- `src/components/FeedbackModal.jsx`

When the feedback modal opens, it checks the current Supabase user. A signed-in, non-anonymous user's email is filled into the email field when the field is blank. The visitor can still edit or remove it.

Anonymous Supabase sessions do not autofill an email address.
