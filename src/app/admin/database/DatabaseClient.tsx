"use client";

import { useState, useEffect } from 'react';
import { Database, Terminal, Key, Table, Play, Trash2, Edit2, Check, X, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

type Props = {
  hasDbUrl: boolean;
};

type TableMeta = {
  name: string;
  columns_count: number;
  primary_key: string | null;
};

export function DatabaseClient({ hasDbUrl }: Props) {
  const [tables, setTables] = useState<TableMeta[]>([]);
  const [activeTab, setActiveTab] = useState<'explorer' | 'sql'>('explorer');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [pkColumn, setPkColumn] = useState<string | null>(null);
  
  // SQL Editor State
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM users LIMIT 10;');
  const [sqlResult, setSqlResult] = useState<any[] | null>(null);
  const [sqlError, setSqlError] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);
  const [duration, setDuration] = useState(0);

  // Table Explorer State
  const [tableData, setTableData] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  
  // Editing State
  const [editingCell, setEditingCell] = useState<{ rowIdx: number, colName: string, value: string } | null>(null);
  const [deletingRow, setDeletingRow] = useState<number | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (hasDbUrl) fetchSchema();
  }, [hasDbUrl]);

  const fetchSchema = async () => {
    try {
      const res = await fetch('/api/admin/database/schema');
      const data = await res.json();
      if (data.tables) setTables(data.tables);
    } catch (e) {
      toast.error('Failed to fetch schema');
    }
  };

  const handleRunSql = async () => {
    setExecuting(true);
    setSqlError(null);
    try {
      const res = await fetch('/api/admin/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sqlQuery })
      });
      const data = await res.json();
      if (data.error) {
        setSqlError(data.error);
        setSqlResult(null);
      } else {
        setSqlResult(data.data || []);
        setDuration(data.durationMs || 0);
        toast.success(`Query OK (${data.rowCount || (data.data?.length || 0)} rows, ${data.durationMs}ms)`);
      }
    } catch (e: any) {
      setSqlError(e.message);
    } finally {
      setExecuting(false);
    }
  };

  const loadTableData = async (tableName: string) => {
    setSelectedTable(tableName);
    setActiveTab('explorer');
    setLoadingData(true);
    setEditingCell(null);
    
    // Find Primary Key
    const tMeta = tables.find(t => t.name === tableName);
    setPkColumn(tMeta?.primary_key || null);

    try {
      const res = await fetch('/api/admin/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: `SELECT * FROM "${tableName}" LIMIT 100` })
      });
      const data = await res.json();
      if (data.error) toast.error(data.error);
      else setTableData(data.data || []);
    } finally {
      setLoadingData(false);
    }
  };

  // CRUD OPERATIONS
  
  const handleSaveCell = async () => {
    if (!editingCell || !selectedTable) return;
    if (!pkColumn) {
      toast.error('Cannot edit table without a Primary Key.');
      setEditingCell(null);
      return;
    }

    const { rowIdx, colName, value } = editingCell;
    const row = tableData[rowIdx];
    const pkValue = row[pkColumn];
    
    // Prevent useless updates
    if (row[colName] === value || (row[colName] === null && value === '')) {
      setEditingCell(null);
      return;
    }

    setUpdating(true);
    try {
      // Escape single quotes for SQL safely, assuming value is string
      const escapedValue = value.replace(/'/g, "''");
      const isNull = value === '';
      const updateVal = isNull ? 'NULL' : `'${escapedValue}'`;
      const pkFilter = typeof pkValue === 'number' ? pkValue : `'${String(pkValue).replace(/'/g, "''")}'`;

      const query = `UPDATE "${selectedTable}" SET "${colName}" = ${updateVal} WHERE "${pkColumn}" = ${pkFilter} RETURNING *;`;
      
      const res = await fetch('/api/admin/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      
      if (data.error) {
        toast.error(`Update failed: ${data.error}`);
      } else {
        toast.success('Row updated');
        // Update local state
        const newData = [...tableData];
        newData[rowIdx] = data.data[0] || { ...row, [colName]: isNull ? null : value };
        setTableData(newData);
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUpdating(false);
      setEditingCell(null);
    }
  };

  const handleDeleteRow = async (rowIdx: number) => {
    if (!selectedTable || !pkColumn) return;
    const row = tableData[rowIdx];
    const pkValue = row[pkColumn];
    
    setUpdating(true);
    try {
      const pkFilter = typeof pkValue === 'number' ? pkValue : `'${String(pkValue).replace(/'/g, "''")}'`;
      const query = `DELETE FROM "${selectedTable}" WHERE "${pkColumn}" = ${pkFilter};`;
      
      const res = await fetch('/api/admin/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      
      if (data.error) {
        toast.error(`Delete failed: ${data.error}`);
      } else {
        toast.success('Row deleted');
        setTableData(tableData.filter((_, i) => i !== rowIdx));
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUpdating(false);
      setDeletingRow(null);
    }
  };

  if (!hasDbUrl) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-5 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
          <Key className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Direct Database Connection Required</h2>
        <p className="text-neutral-400 max-w-lg mb-8">
          To enable the advanced Database Management Center (SQL Editor, Dynamic Explorer, Triggers, Policies), you must connect Lumina directly to your PostgreSQL database.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-6rem)] -m-4 flex border border-neutral-800 bg-[#0a0a0a] rounded-lg overflow-hidden">
      
      {/* Sidebar */}
      <div className="w-64 border-r border-neutral-800 bg-neutral-900/30 flex flex-col">
        <div className="p-4 border-b border-neutral-800">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-400" />
            Lumina DB
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          <div className="px-3 mb-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Tables ({tables.length})</div>
          <div className="space-y-0.5 px-2">
            {tables.map(t => (
              <button
                key={t.name}
                onClick={() => loadTableData(t.name)}
                className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors flex items-center justify-between ${selectedTable === t.name ? 'bg-indigo-500/10 text-indigo-400' : 'text-neutral-300 hover:bg-neutral-800'}`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Table className="w-3.5 h-3.5 shrink-0 opacity-50" />
                  <span className="truncate">{t.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-[#121212] overflow-hidden relative">
        
        {/* Loading Overlay for Updates */}
        {updating && (
          <div className="absolute inset-0 bg-black/20 z-50 flex items-center justify-center backdrop-blur-[1px]">
            <div className="px-4 py-2 bg-neutral-900 rounded-md border border-neutral-800 text-sm text-white shadow-xl animate-pulse">
              Saving changes...
            </div>
          </div>
        )}

        {/* Topbar Tabs */}
        <div className="flex items-center border-b border-neutral-800 bg-[#0a0a0a]">
          <button 
            onClick={() => setActiveTab('explorer')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'explorer' ? 'border-indigo-500 text-white' : 'border-transparent text-neutral-500 hover:text-neutral-300'}`}
          >
            Data Explorer
          </button>
          <button 
            onClick={() => setActiveTab('sql')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'sql' ? 'border-indigo-500 text-white' : 'border-transparent text-neutral-500 hover:text-neutral-300'}`}
          >
            <Terminal className="w-4 h-4" />
            SQL Editor
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden flex flex-col relative">
          
          {/* TAB: EXPLORER */}
          {activeTab === 'explorer' && (
            <div className="flex-1 flex flex-col min-h-0">
              {!selectedTable ? (
                <div className="flex-1 flex items-center justify-center text-neutral-500 text-sm">
                  Select a table from the sidebar to view data
                </div>
              ) : (
                <>
                  <div className="p-3 border-b border-neutral-800 bg-[#0a0a0a] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h2 className="text-white font-mono text-sm">{selectedTable}</h2>
                      {pkColumn ? (
                        <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">PK: {pkColumn}</span>
                      ) : (
                        <span className="text-xs text-amber-500 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> No PK (Read-only)</span>
                      )}
                    </div>
                    <span className="text-xs text-neutral-500">{tableData.length} rows (limit 100)</span>
                  </div>
                  <div className="flex-1 overflow-auto overflow-x-auto">
                    {loadingData ? (
                      <div className="p-8 text-center text-sm text-neutral-500">Loading data...</div>
                    ) : tableData.length === 0 ? (
                      <div className="p-8 text-center text-sm text-neutral-500">Table is empty</div>
                    ) : (
                      <table className="min-w-max text-left text-sm text-neutral-300 whitespace-nowrap">
                        <thead className="bg-neutral-900 sticky top-0 border-b border-neutral-800 z-10">
                          <tr>
                            <th className="w-12 px-2 py-2 border-r border-neutral-800"></th>
                            {Object.keys(tableData[0]).map(col => (
                              <th key={col} className="px-4 py-2 font-mono text-xs font-semibold text-neutral-400 border-r border-neutral-800 min-w-[120px] max-w-[280px]">
                                {col}
                                {col === pkColumn && <Key className="w-3 h-3 inline-block ml-1 text-indigo-500" />}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800">
                          {tableData.map((row, i) => (
                            <tr key={i} className="hover:bg-neutral-900/30 group">
                              <td className="px-2 py-1.5 border-r border-neutral-800 text-center">
                                {deletingRow === i ? (
                                  <div className="flex items-center gap-1">
                                    <button onClick={() => handleDeleteRow(i)} className="text-red-400 hover:text-red-300"><Check className="w-4 h-4"/></button>
                                    <button onClick={() => setDeletingRow(null)} className="text-neutral-500 hover:text-neutral-300"><X className="w-4 h-4"/></button>
                                  </div>
                                ) : (
                                  <button onClick={() => setDeletingRow(i)} disabled={!pkColumn} className="text-neutral-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </td>
                              {Object.entries(row).map(([col, val]) => {
                                const isEditing = editingCell?.rowIdx === i && editingCell?.colName === col;
                                
                                return (
                                  <td 
                                    key={col} 
                                    onDoubleClick={() => {
                                      if (col === pkColumn || !pkColumn) return; // Disallow editing PK
                                      setEditingCell({ rowIdx: i, colName: col, value: val === null ? '' : String(val) });
                                    }}
                                    className={`px-4 py-1.5 border-r border-neutral-800 truncate min-w-[120px] max-w-[280px] ${col !== pkColumn && pkColumn ? 'cursor-text hover:bg-neutral-800/50' : ''}`}
                                  >
                                    {isEditing ? (
                                      <input
                                        autoFocus
                                        className="w-full bg-neutral-950 text-white border border-indigo-500 rounded px-2 py-1 text-xs outline-none"
                                        value={editingCell.value}
                                        onChange={e => setEditingCell({...editingCell, value: e.target.value})}
                                        onKeyDown={e => {
                                          if (e.key === 'Enter') handleSaveCell();
                                          if (e.key === 'Escape') setEditingCell(null);
                                        }}
                                        onBlur={handleSaveCell}
                                      />
                                    ) : val === null ? (
                                      <span className="text-neutral-600 italic">null</span>
                                    ) : typeof val === 'object' ? (
                                      JSON.stringify(val)
                                    ) : (
                                      String(val)
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB: SQL EDITOR */}
          {activeTab === 'sql' && (
            <div className="flex-1 flex flex-col h-full min-h-0">
              <div className="h-1/2 border-b border-neutral-800 flex flex-col relative bg-[#1e1e1e] shrink-0">
                <textarea
                  value={sqlQuery}
                  onChange={e => setSqlQuery(e.target.value)}
                  className="flex-1 w-full p-4 bg-transparent text-neutral-200 font-mono text-sm resize-none focus:outline-none"
                  placeholder="SELECT * FROM users;"
                  spellCheck={false}
                />
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <button 
                    onClick={handleRunSql} 
                    disabled={executing || !sqlQuery.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-medium text-sm transition-colors disabled:opacity-50"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    {executing ? 'Running...' : 'Run Query'}
                  </button>
                </div>
              </div>
              
              <div className="h-1/2 bg-[#0a0a0a] flex flex-col min-h-0">
                {sqlError ? (
                  <div className="p-4 m-4 rounded bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div className="text-sm text-red-400 font-mono whitespace-pre-wrap">{sqlError}</div>
                  </div>
                ) : !sqlResult ? (
                  <div className="p-8 text-center text-sm text-neutral-600">Run a query to see results here</div>
                ) : sqlResult.length === 0 ? (
                  <div className="p-4 border-b border-neutral-800 text-xs text-neutral-500 flex justify-between">
                    <span>Query executed successfully. No rows returned.</span>
                    <span>{duration}ms</span>
                  </div>
                ) : (
                  <>
                    <div className="p-2 border-b border-neutral-800 bg-neutral-900/50 text-xs text-neutral-500 flex justify-between sticky top-0 z-10">
                      <span>{sqlResult.length} rows</span>
                      <span>{duration}ms</span>
                    </div>
                    <div className="flex-1 overflow-auto">
                      <table className="w-full text-left text-sm text-neutral-300 whitespace-nowrap">
                        <thead className="bg-neutral-900 sticky top-0 border-b border-neutral-800 z-10">
                          <tr>
                            {Object.keys(sqlResult[0]).map(col => (
                              <th key={col} className="px-4 py-2 font-mono text-xs font-semibold text-neutral-400 border-r border-neutral-800 last:border-0">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800">
                          {sqlResult.map((row, i) => (
                            <tr key={i} className="hover:bg-neutral-900/50">
                              {Object.values(row).map((val: any, j) => (
                                <td key={j} className="px-4 py-1.5 border-r border-neutral-800 last:border-0 truncate max-w-[300px]">
                                  {val === null ? <span className="text-neutral-600 italic">null</span> : typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
