import React, { useEffect, useState, useMemo } from 'react';
import dashStyles from './Dashboard.module.css';
import { getBackendUrl } from '../utils/api';
import { useNavigate } from 'react-router-dom';

export default function AdminSuscripciones() {
	const [pendientes, setPendientes] = useState([]);
	const [usuariosEstado, setUsuariosEstado] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [loadingUsuarios, setLoadingUsuarios] = useState(false);
	const [errorUsuarios, setErrorUsuarios] = useState('');
	const [filter, setFilter] = useState('todos');
	const [expandedId, setExpandedId] = useState(null);
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
	const token = localStorage.getItem('token');
    const navigate = useNavigate();

	const cargarPendientes = async () => {
		setLoading(true); setError('');
		try {
			const res = await fetch(`${getBackendUrl()}/suscripciones/pendientes`, {
				headers: { 'Authorization': `Bearer ${token}` }
			});
			const data = await res.json();
			if (res.ok) setPendientes(data); else setError(data.message || 'Error cargando solicitudes');
		} catch { setError('Error de red'); } finally { setLoading(false); }
	};

	const cargarUsuariosEstado = async () => {
		setLoadingUsuarios(true); setErrorUsuarios('');
		try {
			const res = await fetch(`${getBackendUrl()}/suscripciones/admin-usuarios`, {
				headers: { 'Authorization': `Bearer ${token}` }
			});
			const data = await res.json();
			if (res.ok) setUsuariosEstado(data); else setErrorUsuarios(data.message || 'Error cargando usuarios');
		} catch { setErrorUsuarios('Error de red'); } finally { setLoadingUsuarios(false); }
	};

	useEffect(() => { cargarPendientes(); cargarUsuariosEstado(); }, []);

	const aprobar = async (id) => {
		try {
			const res = await fetch(`${getBackendUrl()}/suscripciones/${id}/aprobar`, { method:'PUT', headers:{ 'Authorization':`Bearer ${token}` }});
			if (res.ok) { cargarPendientes(); cargarUsuariosEstado(); }
		} catch {}
	};
	const rechazar = async (id) => {
		try {
			const res = await fetch(`${getBackendUrl()}/suscripciones/${id}/rechazar`, { method:'PUT', headers:{ 'Authorization':`Bearer ${token}` }});
			if (res.ok) { cargarPendientes(); cargarUsuariosEstado(); }
		} catch {}
	};
	const suspenderUsuario = async (id) => {
		try {
			const res = await fetch(`${getBackendUrl()}/suscripciones/usuarios/${id}/suspender`, { method:'PUT', headers:{ 'Authorization':`Bearer ${token}` }});
			if (res.ok) cargarUsuariosEstado();
		} catch {}
	};
	const rehabilitarUsuario = async (id) => {
		try {
			const res = await fetch(`${getBackendUrl()}/suscripciones/usuarios/${id}/rehabilitar`, { method:'PUT', headers:{ 'Authorization':`Bearer ${token}` }});
			if (res.ok) cargarUsuariosEstado();
		} catch {}
	};

	// Derivar categoría de estado para orden y color
	const deriveCategoria = (entry) => {
		if (entry.tipo === 'pendiente') return 'pendiente';
		const u = entry.data;
		if (u.estadoComputado === 'suspendido') return 'suspendido';
		if (u.estadoComputado === 'expirada') return 'vencida';
		if (u.estadoComputado === 'expirada-gracia') return 'en-gracia';
		if (u.diasRestantes !== null) {
			if (u.diasRestantes <= 0) return 'vencida';
			if (u.diasRestantes <= 7) return 'por-vencer';
			return 'activa';
		}
		return 'activa';
	};

	const combined = useMemo(() => {
		const pendMapped = pendientes.map(p => ({
			id: p._id,
			tipo: 'pendiente',
			usuarioId: p.usuario?._id,
			nombre: p.usuario?.username || p.usuario?.nombre,
			email: p.usuario?.email,
			plan: p.plan,
			monto: p.monto,
			comprobanteUrl: p.comprobanteUrl,
			data: p // referencia completa
		}));
		const usuariosMapped = usuariosEstado.map(u => ({
			id: u.usuario._id,
			tipo: 'usuario',
			usuarioId: u.usuario._id,
			nombre: u.usuario.username || u.usuario.nombre,
			email: u.usuario.email,
			diasRestantes: u.diasRestantes,
			diasGraciaRestantes: u.diasGraciaRestantes,
			estadoComputado: u.estadoComputado,
			pendiente: u.pendiente,
			data: u
		}));
		const merged = [...pendMapped, ...usuariosMapped];
		return merged.map(m => ({ ...m, categoria: deriveCategoria(m) }));
	}, [pendientes, usuariosEstado]);

	// Orden personalizado: vencida -> por-vencer -> en-gracia -> suspendido -> pendiente -> activa
	const priority = (cat) => {
		switch (cat) {
			case 'vencida': return 0;
			case 'por-vencer': return 1;
			case 'en-gracia': return 2;
			case 'suspendido': return 3;
			case 'pendiente': return 4;
			case 'activa': return 5;
			default: return 6;
		}
	};

	const filteredSorted = useMemo(() => {
				const term = searchTerm.trim().toLowerCase();
			return combined
				.filter(e => filter === 'todos' || e.categoria === filter)
				.filter(e => !term || (String(e.nombre || '').toLowerCase().includes(term) || String(e.email || '').toLowerCase().includes(term)))
			.sort((a, b) => {
				const pa = priority(a.categoria); const pb = priority(b.categoria);
				if (pa !== pb) return pa - pb;
				// Dentro de misma categoría ordenar por días restantes asc (los que menos días primero)
				const da = a.diasRestantes ?? 9999; const db = b.diasRestantes ?? 9999;
				return da - db;
			});
			}, [combined, filter, searchTerm]);

	const colorFor = (cat) => {
		switch (cat) {
			case 'vencida': return { background:'#ffdddd', border:'2px solid #e74c3c' };
			case 'por-vencer': return { background:'#fff4cc', border:'2px solid #f39c12' };
			case 'en-gracia': return { background:'#ffe7b3', border:'2px solid #e67e22' };
			case 'suspendido': return { background:'#ffd4d4', border:'2px solid #c0392b' };
			case 'pendiente': return { background:'#dbefff', border:'2px solid #3498db' };
			case 'activa': return { background:'#e3f9e1', border:'2px solid #2ecc71' };
			default: return { background:'#eee' };
		}
	};

	const toggleExpand = (id) => {
		setExpandedId(expandedId === id ? null : id);
	};

	return (
			<div style={{ padding:16 }}>
					<div className={dashStyles.topBar}>
					<span className={dashStyles.titulo}>Administración de suscripciones</span>
						<div style={{ display:'flex', gap:8, flexWrap:'wrap', position:'relative' }}>
			    <input
			    className={dashStyles.searchInput}
							placeholder="Buscar por nombre o email"
							value={searchTerm}
							onChange={(e)=>setSearchTerm(e.target.value)}
					    	style={{ minWidth: 200, width: 180,padding: '10px 15px'}}
						/>
						<div style={{ position:'relative' }}>
							<button
								className={dashStyles.btnAgregarManzana}
								onClick={()=> setShowFilterMenu(v=>!v)}
							>{`Filtro: ${filter.replace('-', ' ')}`}</button>
							{showFilterMenu && (
								<div style={{ position:'absolute', right:0, top:'calc(100% + 8px)', background:'rgba(23,21,18,0.96)', color:'#eaf7d9', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8, boxShadow:'0 12px 32px rgba(0,0,0,0.4)', minWidth:180, zIndex:20 }}>
									{['todos','vencida','por-vencer','en-gracia','suspendido','pendiente','activa'].map(opt => (
										<div key={opt}
												 onClick={()=>{ setFilter(opt); setShowFilterMenu(false); }}
												 style={{ padding:'8px 12px', cursor:'pointer', background: filter===opt ? 'rgba(255,255,255,0.06)' : 'transparent' }}>
											{opt.replace('-', ' ')}
										</div>
									))}
								</div>
							)}
						</div>
						<button onClick={() => { cargarPendientes(); cargarUsuariosEstado(); }} className={dashStyles.btnAgregarManzana}>Refrescar</button>
						<button onClick={() => navigate(-1)} className={dashStyles.btnAgregarManzana}>Regresar</button>
					</div>
				</div>

			{(loading || loadingUsuarios) && <p>Cargando datos…</p>}
			{(error || errorUsuarios) && <p style={{ color:'#c0392b' }}>{error || errorUsuarios}</p>}

			<div style={{ marginTop:16, display:'grid', gap:12 }}>
				{filteredSorted.length === 0 && <p>No hay registros.</p>}
				{filteredSorted.map(item => {
					const style = colorFor(item.categoria);
					const isExpanded = expandedId === item.id;
					return (
						<div
							key={item.id}
							onClick={() => toggleExpand(item.id)}
							style={{ ...style, padding:14, borderRadius:12, cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,0.15)', transition:'background .25s, transform .25s' }}
						>
							<div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
								<div style={{ fontWeight:700, fontSize:16 }}>{item.nombre || '—'} <span style={{ fontSize:11, fontWeight:400 }}>({item.email})</span></div>
								<div style={{ fontSize:12, fontWeight:600, textTransform:'uppercase' }}>{item.categoria}</div>
							</div>
							{isExpanded && (
								<div style={{ marginTop:10, fontSize:13, lineHeight:1.4 }}>
									{item.tipo === 'pendiente' && (
										<>
											<div><strong>Solicitud pendiente</strong></div>
											<div>Plan: {item.plan === '1m' ? '1 mes' : item.plan === '3m' ? '3 meses' : '1 año'} · Q.{item.monto}</div>
											{item.comprobanteUrl && (() => {
												const raw = item.comprobanteUrl;
												const abs = /^https?:/i.test(raw) ? raw : `${getBackendUrl()}${raw.startsWith('/') ? raw : '/' + raw}`;
												return <div style={{ marginTop:6 }}><a href={abs} target="_blank" rel="noreferrer">Ver comprobante</a></div>;
											})()}
											<div style={{ marginTop:8, display:'flex', gap:8, flexWrap:'wrap' }} onClick={e => e.stopPropagation()}>
												<button className={dashStyles.btnAgregarManzana} onClick={() => aprobar(item.id)}>Aprobar</button>
												<button className={dashStyles.btnAgregarManzana} style={{ background:'#c0392b' }} onClick={() => rechazar(item.id)}>Rechazar</button>
											</div>
										</>
									)}
									{item.tipo === 'usuario' && (
										<>
											<div><strong>Estado:</strong> {item.estadoComputado}</div>
											{item.diasRestantes !== null && <div>Días restantes: {item.diasRestantes}</div>}
											{item.diasGraciaRestantes !== null && <div>Gracia restante: {item.diasGraciaRestantes}</div>}
											{item.pendiente && <div style={{ color:'#d35400' }}>Tiene solicitud pendiente aún no aprobada.</div>}
											<div style={{ marginTop:8, display:'flex', gap:8, flexWrap:'wrap' }} onClick={e => e.stopPropagation()}>
												{item.estadoComputado !== 'suspendido' && (
													<button className={dashStyles.btnAgregarManzana} style={{ background:'#c0392b' }} onClick={() => suspenderUsuario(item.usuarioId)}>Suspender</button>
												)}
												{item.estadoComputado === 'suspendido' && (
													<button className={dashStyles.btnAgregarManzana} style={{ background:'#27ae60' }} onClick={() => rehabilitarUsuario(item.usuarioId)}>Rehabilitar</button>
												)}
											</div>
										</>
									)}
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
