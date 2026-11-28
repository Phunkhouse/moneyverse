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
    close: 'Zavřít',
    save: 'Uložit',
    cancel: 'Zrušit',
    archive: 'Archivovat',
    unarchive: 'Obnovit',
    archived: 'Archivované',
    edit: 'Upravit',
  },
  money: {
    estimated:
      'Přepočteno posledním známým kurzem ČNB; kurz pro tento den zatím není.',
    missingRate:
      'Některý účet v cizí měně nejde přepočítat, protože zatím chybí kurz ČNB. Součet ho nezahrnuje.',
  },
  forms: {
    invalid: 'Zkontrolujte zadané údaje.',
    notFound: 'Záznam už neexistuje. Obnovte stránku.',
    failed: 'Uložení se nepovedlo. Zkuste to znovu.',
    nameRequired: 'Vyplňte název (nejvýš 80 znaků).',
    amountInvalid: 'Zadejte částku jako 1\u00a0234,50.',
    dateInvalid: 'Zadejte platné datum.',
  },
  notFound: {
    title: 'Stránka neexistuje',
    body: 'Odkaz je neplatný, nebo záznam už byl odstraněn.',
    home: 'Zpět na přehled',
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
    subtitle: 'Zůstatky k dnešku',
    emptyTitle: 'Zatím žádné účty',
    emptyBody:
      'Přidejte běžný účet, kartu, spoření i investice. Každý účet může být v CZK, EUR nebo USD.',
    add: 'Přidat účet',
    addTitle: 'Nový účet',
    editTitle: 'Upravit účet',
    back: 'Účty',
    detailTitle: 'Účet',
    netWorth: 'Čisté jmění',
    assets: 'Majetek',
    debts: 'Dluhy',
    approx: (value: string) => `≈ ${value}`,
    groups: {
      everyday: 'Každodenní',
      savings: 'Spoření',
      investments: 'Investice',
      retirement: 'Penzijní',
    },
    types: {
      checking: 'Běžný účet',
      credit_card: 'Kreditní karta',
      savings: 'Spořicí účet',
      brokerage: 'Brokerský účet',
      crypto: 'Kryptoměna',
      managed_fund: 'Podílový fond',
      retirement: 'Penzijní spoření',
    },
    fields: {
      name: 'Název',
      namePlaceholder: 'Např. Běžný účet',
      type: 'Typ',
      currency: 'Měna',
      opening: 'Počáteční zůstatek',
      openingDebt: 'Počáteční dluh',
      openingValue: 'Počáteční hodnota',
      openingHint:
        'Zůstatek ke dni níže. Pozdější pohyby přidáte jako transakce.',
      openingDebtHint: 'Kolik na kartě dlužíte ke dni níže, jako kladné číslo.',
      openingValueHint:
        'Hodnota ke dni níže. Další hodnoty zadáte jednou měsíčně.',
      openedOn: 'Ke dni',
      fixedAfterCreate: 'Typ a měnu po založení změnit nejde.',
    },
    balance: 'Zůstatek dnes',
    value: 'Hodnota k poslednímu zadání',
    carriedFrom: 'převzato z dřívějšího měsíce',
    valueTracked:
      'Hodnotu investičního účtu zadáváte jednou měsíčně; zadávání přijde s další verzí.',
    transactionsTitle: 'Transakce',
    valuesTitle: 'Měsíční hodnoty',
    noTransactions:
      'Transakce půjde zapisovat s rychlým zadáním v další verzi.',
    archivedNote:
      'Do archivovaného účtu nejde zapisovat nové transakce. Historie zůstává a účet se dál počítá do čistého jmění.',
  },
  categories: {
    title: 'Kategorie',
    subtitle: 'Výdaje a příjmy',
    expense: 'Výdaje',
    income: 'Příjmy',
    add: 'Přidat kategorii',
    addTitle: 'Nová kategorie',
    editTitle: 'Upravit kategorii',
    kind: 'Druh',
    name: 'Název',
    namePlaceholder: 'Např. Potraviny',
    duplicate: 'Kategorie s tímto názvem už existuje.',
    emptyExpense: 'Zatím žádné kategorie výdajů.',
    emptyIncome: 'Zatím žádné kategorie příjmů.',
    kindFixed: 'Druh kategorie po založení změnit nejde.',
    link: 'Kategorie',
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
