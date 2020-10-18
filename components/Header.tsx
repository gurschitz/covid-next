import Nav from "./Nav";

export default function Header({ lastUpdated = null }) {
  return (
    <div className="p-4 flex flex-col lg:flex-row items-center lg:justify-between">
      <div>
        <h1 className="text-gray-700 text-3xl lg:text-4xl">
          COVID-19 Österreich
        </h1>
        {lastUpdated && (
          <div className="text-gray-600">Letztes Update: {lastUpdated}</div>
        )}
      </div>
      <Nav />
    </div>
  );
}
