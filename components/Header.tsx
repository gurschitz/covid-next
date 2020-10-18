export default function Header({ lastUpdated = null }) {
  return (
    <div className="py-4">
      <h1 className="text-center text-gray-700 text-3xl lg:text-4xl">
        COVID-19 Österreich
      </h1>
      {lastUpdated && (
        <div className="text-center text-gray-600">
          Letztes Update: {lastUpdated}
        </div>
      )}
    </div>
  );
}
