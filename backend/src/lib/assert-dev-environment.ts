/**
 * Sicherheitsprüfung für Skripte, die nur gegen DEV laufen dürfen
 * (Look-Import, Produktabgleich). Bricht ab, wenn der Datenbank-Host nicht
 * auf der DEV-Liste steht (oder EXPECT_DB_HOST nicht passt), wenn
 * Datenbank-, Redis- oder Bucket-Host nach Prod aussehen oder der
 * Bucket-Host nicht "dev" enthält. Gibt nur Hosts aus, nie Zugangsdaten.
 */

// "centerbeam" = Prod-Postgres-Proxy, "interchange" = Prod-Redis-Proxy
// (Stand jutta-railway-Skill; Proxys können sich ändern)
const PROD_MARKERS = ["prod", "centerbeam", "interchange"]
// Positiv-Liste: nur diese Datenbank-Hosts gelten als DEV. "crossover" ist
// der Dev-Postgres-Proxy (Stand jutta-railway-Skill). Ändert sich der Proxy,
// den neuen Host bewusst per EXPECT_DB_HOST=<host> freigeben.
const DEV_DB_HOSTS = ["crossover.proxy.rlwy.net", "localhost", "127.0.0.1"]

type Log = (line?: string) => void

// Nur Host (und Port) einer Verbindungs-URL – niemals Zugangsdaten
const hostOf = (raw: string | undefined): string | null => {
  if (!raw?.trim()) return null
  try {
    const url = new URL(raw)
    if (url.hostname) {
      return url.port ? `${url.hostname}:${url.port}` : url.hostname
    }
  } catch {
    // z. B. Passwort mit Sonderzeichen – unten von Hand zerlegen
  }
  const withoutScheme = raw.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "")
  const afterAt = withoutScheme.slice(withoutScheme.lastIndexOf("@") + 1)
  const match = afterAt.match(/^([^/?#\s]+)/)
  return match ? match[1] : null
}

const bucketHostOf = (raw: string | undefined): string | null => {
  const host = (raw ?? "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .split("/")[0]
  return host || null
}

export function assertDevEnvironment(out: Log): void {
  const dbHost = hostOf(process.env.DATABASE_URL)
  const redisSet = !!process.env.REDIS_URL?.trim()
  const redisHost = redisSet ? hostOf(process.env.REDIS_URL) : null
  const bucketHost = bucketHostOf(process.env.MINIO_ENDPOINT)

  out("Umgebung")
  out(`  Datenbank: ${dbHost ?? "(nicht lesbar)"}`)
  out(
    `  Redis:     ${
      redisSet ? redisHost ?? "(nicht lesbar)" : "– (nicht gesetzt, In-Memory)"
    }`
  )
  out(`  Bucket:    ${bucketHost ?? "– (MINIO_ENDPOINT nicht gesetzt)"}`)

  const problems: string[] = []

  if (!dbHost) {
    problems.push("DATABASE_URL fehlt oder ist nicht lesbar")
  } else {
    // hostOf liefert "host:port" – verglichen wird der Hostname ohne Port
    const dbHostname = dbHost.toLowerCase().replace(/:\d+$/, "")
    const expected = process.env.EXPECT_DB_HOST?.trim().toLowerCase()
    const allowed = expected ? [expected.replace(/:\d+$/, "")] : DEV_DB_HOSTS
    if (!allowed.includes(dbHostname)) {
      problems.push(
        `Datenbank-Host "${dbHost}" ist kein bekannter DEV-Host (${allowed.join(", ")}). ` +
          `Ist das sicher DEV, mit EXPECT_DB_HOST=${dbHost} bestätigen.`
      )
    }
  }
  if (redisSet && !redisHost) problems.push("REDIS_URL ist nicht lesbar")

  if (!bucketHost) {
    problems.push(
      "MINIO_ENDPOINT fehlt – die Fotos würden im lokalen static/-Ordner landen"
    )
  } else {
    if (!bucketHost.toLowerCase().includes("dev")) {
      problems.push(`Bucket-Host "${bucketHost}" enthält nicht "dev"`)
    }
    if (!process.env.MINIO_ACCESS_KEY || !process.env.MINIO_SECRET_KEY) {
      problems.push(
        "MINIO_ACCESS_KEY oder MINIO_SECRET_KEY fehlt – dann nutzt Medusa den lokalen Datei-Provider"
      )
    }
  }

  const hosts: [string, string | null][] = [
    ["Datenbank", dbHost],
    ["Redis", redisHost],
    ["Bucket", bucketHost],
  ]
  for (const [label, host] of hosts) {
    const marker = host
      ? PROD_MARKERS.find((m) => host.toLowerCase().includes(m))
      : undefined
    if (marker) {
      problems.push(`${label}-Host "${host}" sieht nach PROD aus ("${marker}")`)
    }
  }

  if (problems.length) {
    throw new Error(
      `Abbruch – das ist nicht die DEV-Umgebung:\n  - ${problems.join("\n  - ")}`
    )
  }
}
