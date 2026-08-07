export default function CardStat({ title, value, icon: Icon, change, color = "amber" }) {
  const colorMap = {
    amber: {
      bg: "bg-amber-500/10",
      icon: "text-amber-400",
      border: "border-amber-500/20",
      badge: "bg-green-500/10 text-green-400",
    },
    blue: {
      bg: "bg-blue-500/10",
      icon: "text-blue-400",
      border: "border-blue-500/20",
      badge: "bg-green-500/10 text-green-400",
    },
    green: {
      bg: "bg-green-500/10",
      icon: "text-green-400",
      border: "border-green-500/20",
      badge: "bg-green-500/10 text-green-400",
    },
    purple: {
      bg: "bg-purple-500/10",
      icon: "text-purple-400",
      border: "border-purple-500/20",
      badge: "bg-green-500/10 text-green-400",
    },
  };

  const c = colorMap[color] || colorMap.amber;

  return (
    <div className={`bg-white border ${c.border} rounded-2xl p-5 hover:border-opacity-60 transition-all duration-200`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <h2 className="text-2xl font-bold text-gray-900 mt-1.5">{value}</h2>
          {change && (
            <span className={`inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full ${c.badge}`}>
              {change}
            </span>
          )}
        </div>
        {Icon && (
          <div className={`w-11 h-11 ${c.bg} rounded-xl flex items-center justify-center`}>
            <Icon className={`text-xl ${c.icon}`} />
          </div>
        )}
      </div>
    </div>
  );
}

