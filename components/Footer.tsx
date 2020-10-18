import Link from "next/link";

export default function Footer() {
  return (
    <div className="space-y-1 pb-10 pt-5">
      <div className="text-center text-gray-600">
        Daten von{" "}
        <a
          className="text-blue-500"
          href="https://covid19-dashboard.ages.at/"
          target="_blank"
          rel="noopener noreferrer"
        >
          AGES Dashboard CSV-Download
        </a>
      </div>
      <div className="text-center">
        <Link href="/imprint">
          <a className="text-blue-500">Impressum</a>
        </Link>
      </div>
    </div>
  );
}
