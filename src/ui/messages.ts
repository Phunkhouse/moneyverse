// The Czech message catalogue (R-25). The interface is Czech only, so this is a plain object
// rather than a translation library; amounts and dates go through ./format.ts.

export const cs = {
  app: {
    name: 'moneyverse',
    description: 'Osobní správce financí',
  },
  shell: {
    skipToContent: 'Přeskočit na obsah',
  },
  nav: {
    label: 'Hlavní navigace',
    overview: 'Přehled',
    accounts: 'Účty',
    add: 'Přidat transakci',
    addSoon: 'Rychlé zadání přijde v další verzi',
    plan: 'Plán',
    charts: 'Grafy',
  },
  theme: {
    label: 'Vzhled',
    system: 'Podle systému',
    light: 'Světlý',
    dark: 'Tmavý',
    toLight: 'Přepnout na světlý vzhled',
    toDark: 'Přepnout na tmavý vzhled',
  },
  common: {
    loading: 'Načítání…',
    comingLater: 'Připravujeme',
  },
  overview: {
    title: 'Přehled',
    emptyTitle: 'Zatím tu nic není',
    emptyBody:
      'Až přidáte účty a první transakce, uvidíte tu čisté jmění, poslední pohyby a hodnoty investic.',
    settings: 'Nastavení',
    signedInAs: (name: string) => `Přihlášeno: ${name}`,
  },
  accounts: {
    title: 'Účty',
    subtitle: 'CZK, EUR a USD',
    emptyTitle: 'Žádné účty',
    emptyBody:
      'Účty, karty, spoření a investice půjde přidat v další verzi aplikace.',
  },
  plan: {
    title: 'Plán',
    subtitle: 'Rozpočty a opakované platby',
    soonTitle: 'Plán připravujeme',
    soonBody:
      'Rozpočty po kategoriích a kalendář opakovaných plateb přijdou v některé z dalších verzí. Do té doby tu nic nastavovat nemusíte.',
  },
  charts: {
    title: 'Grafy',
    subtitle: 'Trendy a srovnání',
    emptyTitle: 'Zatím není co kreslit',
    emptyBody:
      'Grafy čistého jmění, zůstatků a kategorií se objeví, až budou v aplikaci první data.',
  },
  auth: {
    signInTitle: 'Přihlášení',
    signInLead: 'Přihlaste se přístupovým klíčem uloženým v tomto zařízení.',
    signInButton: 'Přihlásit se přístupovým klíčem',
    signInFailed: 'Přihlášení se nepovedlo. Zkuste to znovu.',
    inviteOnly: 'Nemáte účet? Moneyverse je jen na pozvánku.',
    signOut: 'Odhlásit se',
    inviteTitle: 'Pozvánka',
    inviteHeading: 'Pozvánka do moneyverse',
    inviteLead:
      'Vytvořte si přístupový klíč. Uloží se v tomto zařízení (nebo ve správci hesel) a budete se jím přihlašovat místo hesla.',
    inviteButton: 'Vytvořit přístupový klíč',
    inviteFailed:
      'Přístupový klíč se nepodařilo vytvořit. Pozvánka mohla vypršet nebo už byla použita.',
    inviteIncomplete:
      'Odkaz pozvánky je neúplný. Otevřete celý odkaz, který jste dostali.',
  },
} as const
