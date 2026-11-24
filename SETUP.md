# Al-Mumin GST Billing — Cloud setup

This build uses one shared Supabase workspace with no login. Anyone who reaches the app or its public project API can view, create, and edit these invoices and drafts. Use a separate Supabase project for this workspace. Use sample invoices unless you intend the data to be public.

## 1. Back up your old invoices

From the old site, open each browser that has bills and click **Backup Invoices**. Keep those JSON files. If you used an earlier Supabase version, export its bills using that version's backup button too. This build uses a new table named `billing_shared_invoices`.

## 2. Configure Supabase

1. Create a Supabase project and open **SQL Editor → New query**.
2. Open `supabase-setup.sql` from this folder, paste the entire file into SQL Editor and click **Run**.
3. In the project's **Connect** dialog or API settings, copy its **Project URL** and **Publishable key**. Keep the Data API enabled with the `public` schema exposed.
4. Open `supabase-config.js` and replace the two placeholders with those values. Keep the quotes. Use a publishable key, never a secret or service-role key.

## 3. Run on your Windows PC

1. Extract the ZIP and open the inner `almumin-gst-billing` folder in VS Code. This folder contains `index.html`.
2. Right-click `index.html` and choose **Open with Live Server** if you have the Live Server extension. Alternatively, if Python is installed, run `py -m http.server 8000` from the folder and open `http://localhost:8000`.
3. Keep internet access enabled. When the status says **Ready**, type a sample draft and wait until **Draft synced to Supabase** appears under Saved Invoices. Open a second browser window, click **Saved Invoices**, and open that draft. Give it an invoice number, then click **Save Invoice**. Check the saved bill and **Print / Save PDF**.

## 4. Host the website

Deploy the folder containing `index.html` as a static site over HTTPS. For Netlify, point the publish directory to that folder and leave the build command empty. For Vercel, select the folder as the project root and use the **Other** framework preset, with the build command empty and the output directory set to the project root. The app needs no npm installation.

If updating an existing repo, copy the files to the existing site folder. Commit and push to the branch connected to your host. If a previously registered service worker keeps showing an old screen, unregister it in browser developer tools and reload. Export old browser data before clearing any site storage.

## 5. Save, resume, and import

- New bills autosave as drafts after a short pause. Wait for the sync confirmation before leaving or switching devices.
- Click **Saved Invoices** to refresh both lists. Click **Save Invoice** to finalize a draft or apply changes to a previously saved bill.
- If another device changed the same bill, reopen it to see the latest copy before editing.
- **Import Backup** accepts JSON exports from the original local app and the cloud versions. Existing saved invoice numbers are kept. A record without an invoice number imports as a draft. Re-importing a backup can add extra draft copies.
- **Backup Invoices** exports the cloud workspace to JSON. **Print / Save PDF** opens the original print layout.
