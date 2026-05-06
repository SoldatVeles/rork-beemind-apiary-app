# BeeMind Release Checklist

Use this checklist before submitting a build to the App Store or Play Store.

## Auth
- [ ] Sign up with a new email works
- [ ] Login with existing email works
- [ ] Logout works
- [ ] Password reset flow works (if enabled)

## Row-level security (RLS)
- [ ] User A cannot read User B's yards
- [ ] User A cannot read User B's hives
- [ ] User A cannot read User B's inspections
- [ ] User A cannot read User B's tasks
- [ ] User A cannot read User B's harvests
- [ ] User A cannot read User B's inventory

## Core flows
- [ ] Create yard / apiary
- [ ] Create hive inside a yard
- [ ] Create inspection for a hive
- [ ] Create task and mark it complete via checkbox only
- [ ] Create harvest (negative / zero weight rejected)
- [ ] Create inventory item, restock warning shows when below minimum

## Localization
- [ ] Switch to English — all tabs translated
- [ ] Switch to Português — all tabs translated
- [ ] Switch to Español — all tabs translated
- [ ] Switch to Deutsch — all tabs translated
- [ ] Flags display correctly in Settings

## Account / data
- [ ] Delete account flow removes all related data (or queues a request)
- [ ] User can export / view their data (optional for v1)

## Environment
- [ ] `EXPO_PUBLIC_SUPABASE_URL` points to **production** project
- [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY` is the production anon key
- [ ] No development / debug URLs left in `app.config.ts`
- [ ] `extra.supabaseUrl` / `extra.supabaseAnonKey` resolve at runtime

## Supabase production project
- [ ] Migrations `001`, `002`, `003` applied
- [ ] RLS enabled on every table
- [ ] Email auth provider enabled
- [ ] Backups enabled

## App identity
- [ ] `name` = "BeeMind"
- [ ] `slug` = "beemind"
- [ ] `ios.bundleIdentifier` = "com.beemind.app"
- [ ] `android.package` = "com.beemind.app"
- [ ] `version` bumped if resubmitting
- [ ] App icon shows BeeMind branding (honey yellow / charcoal)
- [ ] Adaptive Android icon renders correctly on circle/squircle masks
- [ ] Splash screen uses brand color and logo

## Permissions audit
- [ ] No camera permission requested
- [ ] No location permission requested
- [ ] No notification permission requested
- [ ] No media library permission requested
  (Add only when a feature needs it.)

## Store listings
- [ ] App Store: title, subtitle, keywords, description filled
- [ ] Play Store: short + long description filled
- [ ] Privacy policy URL is live
- [ ] Support URL is live
- [ ] Screenshots taken on required device sizes
