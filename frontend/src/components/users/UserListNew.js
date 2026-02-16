import { useState, useEffect, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from '@tanstack/react-table';
import { $host } from '../../http';

export const UserListNew = () => {
  const [data, setData] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Состояния для таблицы
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState({
    pageIndex: 0, // 0-based index
    pageSize: 100,
  });
  
  // Загрузка данных
  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.pageIndex + 1, // 1-based для бэка
        limit: pagination.pageSize,
        search: globalFilter || undefined,
      };
      
      // Добавляем сортировку если есть
      if (sorting.length > 0) {
        params.sortBy = sorting[0].id;
        params.sortOrder = sorting[0].desc ? 'DESC' : 'ASC';
      }
      
      const response = await $host.get('api/auth/clients', { params });
      setData(response.data.data);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, [pagination.pageIndex, pagination.pageSize, sorting, globalFilter]);
  
  // Определение колонок
  const columns = useMemo(() => [
    {
      accessorKey: 'FIO',
      header: 'ФИО',
      cell: info => info.getValue(),
    },
    {
      accessorKey: 'phone',
      header: 'Телефон',
      cell: info => info.getValue(),
    },
    {
      accessorKey: 'orderCount',
      header: 'Заказов',
      cell: info => info.getValue() || 0,
    },
    {
      accessorKey: 'createdAt',
      header: 'Дата регистрации',
      cell: info => new Date(info.getValue()).toLocaleDateString('ru-RU'),
    },
  ], []);
  
  // Инициализация таблицы
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination,
      globalFilter,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true, // пагинация на сервере
    manualSorting: true,    // сортировка на сервере
    manualFiltering: true,  // фильтрация на сервере
    pageCount: totalPages,
  });
  
  return (
    <div className='flex flex-col m-10'>
      {/* Поиск */}
      <div>
        <input
          value={globalFilter ?? ''}
          onChange={e => setGlobalFilter(e.target.value)}
          placeholder="Поиск по ФИО или телефону..."
          className="search-input"
        />
      </div>
      
      {/* Таблица */}
      <div>
        <table>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th 
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    style={{ cursor: 'pointer' }}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {{
                      asc: ' 🔼',
                      desc: ' 🔽',
                    }[header.column.getIsSorted()] ?? null}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '20px' }}>
                  Загрузка...
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Пагинация */}
      <div>
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Назад
        </button>
        
        <span>
          Страница{' '}
          <strong>
            {table.getState().pagination.pageIndex + 1} из {table.getPageCount()}
          </strong>
        </span>
        
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Вперед
        </button>
        
        <select
          value={table.getState().pagination.pageSize}
          onChange={e => table.setPageSize(Number(e.target.value))}
        >
          {[10, 20, 30, 50, 100].map(pageSize => (
            <option key={pageSize} value={pageSize}>
              Показать {pageSize}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};


