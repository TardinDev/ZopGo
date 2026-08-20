-- Migration 043 — Étend la couverture du journal d'audit
--
-- CONSTAT
-- Le declencheur `audit_trigger` (migration 004) n'etait pose que sur six
-- tables : profiles, trajets, hebergements, notifications, deliveries, trips.
--
-- Les interventions les plus sensibles de l'administration echappaient donc au
-- journal : annuler la reservation d'un client, masquer l'avis d'un heberge,
-- moderer un message prive, diffuser une annonce a tous les utilisateurs. Rien
-- ne permettait de savoir quel administrateur avait agi, ni ce qui existait
-- avant. Or c'est precisement sur ces actions qu'un journal a de la valeur —
-- elles touchent les donnees d'autrui et sont irreversibles a l'oeil nu.
--
-- METHODE
-- La fonction `audit_trigger` est generique : elle lit `TG_TABLE_NAME` et
-- `NEW.id`, et enregistre l'auteur via `auth.jwt() ->> 'sub'`. Elle s'attache
-- donc telle quelle a toute table possedant une colonne `id` — verifie pour
-- les sept tables ci-dessous. Aucune modification de la fonction.
--
-- VOLUME
-- `direct_messages` est la table la plus ecrite des sept. Chaque message y
-- produira desormais une ligne d'audit contenant sa copie complete. C'est
-- assume : la moderation des messages prives est justement ce qu'il faut
-- pouvoir justifier. A surveiller si le volume s'envole.
--
-- L'auteur est enregistre tel que le JWT le presente. Les entrees anterieures
-- a la bascule d'instance Clerk portent des identifiants aujourd'hui retires ;
-- elles ne sont pas reecrites — falsifier un journal d'audit lui oterait sa
-- raison d'etre.

DROP TRIGGER IF EXISTS audit_reservations ON public.reservations;
CREATE TRIGGER audit_reservations
  AFTER INSERT OR UPDATE OR DELETE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

DROP TRIGGER IF EXISTS audit_hebergement_reservations ON public.hebergement_reservations;
CREATE TRIGGER audit_hebergement_reservations
  AFTER INSERT OR UPDATE OR DELETE ON public.hebergement_reservations
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

DROP TRIGGER IF EXISTS audit_direct_messages ON public.direct_messages;
CREATE TRIGGER audit_direct_messages
  AFTER INSERT OR UPDATE OR DELETE ON public.direct_messages
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

DROP TRIGGER IF EXISTS audit_hebergement_reviews ON public.hebergement_reviews;
CREATE TRIGGER audit_hebergement_reviews
  AFTER INSERT OR UPDATE OR DELETE ON public.hebergement_reviews
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

DROP TRIGGER IF EXISTS audit_admin_messages ON public.admin_messages;
CREATE TRIGGER audit_admin_messages
  AFTER INSERT OR UPDATE OR DELETE ON public.admin_messages
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

DROP TRIGGER IF EXISTS audit_agency_invitations ON public.agency_invitations;
CREATE TRIGGER audit_agency_invitations
  AFTER INSERT OR UPDATE OR DELETE ON public.agency_invitations
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

DROP TRIGGER IF EXISTS audit_payments ON public.payments;
CREATE TRIGGER audit_payments
  AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
