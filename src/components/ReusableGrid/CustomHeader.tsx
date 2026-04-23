import React from 'react';
import { IHeaderParams } from 'ag-grid-community';
import { Filter } from 'lucide-react';

export default function CustomHeader(params: IHeaderParams) {
  const [isFilterActive, setIsFilterActive] = React.useState(params.column.isFilterActive());

  const onFilterChanged = () => {
    setIsFilterActive(params.column.isFilterActive());
  };

  React.useEffect(() => {
    params.column.addEventListener('filterChanged', onFilterChanged);
    return () => {
      params.column.removeEventListener('filterChanged', onFilterChanged);
    };
  }, [params.column]);

  const onMenuClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    params.showColumnMenu(event.currentTarget as HTMLElement);
  };

  return (
    <div className="flex items-center justify-between w-full h-full group px-2 select-none cursor-pointer">
      <div className="flex items-center gap-2 overflow-hidden overflow-ellipsis whitespace-nowrap">
        <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {params.displayName}
        </span>
      </div>
      
      <div 
        onClick={onMenuClick}
        className={`
          flex items-center justify-center w-6 h-6 rounded motion-hover
          ${isFilterActive 
            ? 'bg-brand-accent text-white opacity-100 scale-100 shadow-sm shadow-brand-accent/20' 
            : 'text-slate-400 opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 hover:bg-slate-200 dark:hover:bg-slate-800'
          }
          active:scale-95
        `}
      >
        <Filter size={12} className={isFilterActive ? "animate-pulse" : "group-hover:rotate-12 transition-transform"} />
      </div>
    </div>
  );
}
