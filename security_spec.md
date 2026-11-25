# Sicherheits-Spezifikation (Firestore Security Rules)

## 1. Daten-Invarianten
1. Jeder Lernstand unter `/users/{userId}/private/progress` gehört exakt einem verifizierten Benutzer (`request.auth.uid == userId` und `request.auth.token.email_verified == true`).
2. Das Feld `uid` muss bei Erstellung mit `request.auth.uid` übereinstimmen und bleibt danach unveränderlich.
3. `createdAt` und `updatedAt` müssen bei Erstellung exakt `request.time` entsprechen; bei Aktualisierungen bleibt `createdAt` unveränderlich und `updatedAt` muss `request.time` entsprechen.
4. `grade` ist strikt auf die Ganzzahlen `1..6` begrenzt; `preferredSubject` ist auf `['Mathe', 'Deutsch', 'NMG', 'Englisch']` begrenzt.
5. `stars` (`0..100000`), `streak` (`0..10000`), `displayName` (`1..80` Zeichen) und `completedIds` (Liste mit maximal `200` Strings je `<= 32` Zeichen) sind streng typ- und grössenbeschränkt.
6. Unbekannte Schattenfelder (Shadow Fields) sowie `list`-Abfragen auf Benutzerpfade sind vollständig gesperrt.

## 2. Dirty Dozen Angriffs-Payloads (müssen alle abgelehnt werden)
1. Unauthentifizierter Zugriff (`request.auth == null`) auf `/users/u1/private/progress`.
2. Zugriff mit unverifizierter E-Mail (`email_verified == false`).
3. Fremder Benutzer (`u2`) versucht `get` oder `write` auf `/users/u1/private/progress`.
4. Identity Spoofing beim Erstellen: `uid: "u2"` durch Benutzer `u1`.
5. Shadow-Feld-Injektion: zusätzliches Feld `isAdmin: true` im Dokument.
6. Überschreiten von `displayName` (> 80 Zeichen) oder leerer `displayName`.
7. Ungültige Klassenstufe: `grade: 9` oder `grade: "3"`.
8. Ungültiges Fach: `preferredSubject: "Physik"`.
9. Negative oder überhöhte Sterne: `stars: -5` oder `stars: 9999999`.
10. Array-Overflow bei `completedIds`: > 200 Einträge oder falscher Elementtyp (`[123]`).
11. Manipulierte Zeitstempel: `createdAt` in der Vergangenheit oder Änderung von `createdAt` beim Update.
12. Path-ID-Poisoning: `userId` länger als 128 Zeichen oder mit ungültigen Sonderzeichen (`../admin`).
