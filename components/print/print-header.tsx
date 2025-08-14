interface PrintHeaderProps {
  title: string;
  subtitle?: string;
  date?: string;
}

export function PrintHeader({ title, subtitle, date }: PrintHeaderProps) {
  const currentDate = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long', 
    year: 'numeric'
  });

  return (
    <div className="print-header hidden print:flex">
      <div>
        <h1 className="print-logo">ABC Bédarieux</h1>
        <p className="text-xs text-gray-600 mt-1">
          Imprimé le {currentDate}
        </p>
      </div>
      <div className="text-right">
        <h2 className="text-lg font-semibold">{title}</h2>
        {subtitle && (
          <p className="text-sm text-gray-600">{subtitle}</p>
        )}
        {date && (
          <p className="text-sm font-medium">{date}</p>
        )}
      </div>
    </div>
  );
}