import React, { useEffect, useState } from "react";
import styles from "./indexClients.module.css";
import toast from "react-hot-toast";
import { readJsonSafely } from "../../../lib/apiResponse";
import { apiFetch } from "../../../lib/apiFetch";
import type { Category } from "../../../../types/category";
import type { CategorySummary } from "../../../../types/category";
import { formatDateISO } from "../../../utils/dateUtils";

interface Cliente {
  codUsuario: string;
  dni: string;
  nombre: string;
  apellido: string;
  telefono?: string | null;
  email?: string | null;
  cuil?: string | null;
  codSucursal?: string | null;
  categoriaActual?: CategorySummary | null;
  appointmentCounts?: {
    total: number;
    canceled: number;
  };
}

type ClienteProfile = Cliente;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getDataArray = <T,>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (isRecord(value) && Array.isArray(value.data)) return value.data as T[];
  return [];
};

const isCategoria = (value: unknown): value is Category =>
  isRecord(value) &&
  typeof value.codCategoria === "string" &&
  typeof value.nombreCategoria === "string";

const IndexClients = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [profilesCache, setProfilesCache] = useState<
    Record<string, ClienteProfile>
  >({});
  const [categorias, setCategorias] = useState<Category[]>([]);
  const [selectedCategoria, setSelectedCategoria] = useState<string>("all");
  const [visibleClients, setVisibleClients] = useState<Cliente[]>([]);

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const response = await apiFetch(`/usuarios?type=client`);
        if (!response.ok) {
          const errorData = await readJsonSafely(response);
          const text = JSON.stringify(errorData ?? {});
          console.error("/usuarios error body:", text);
          throw new Error(`HTTP ${response.status} - ${text}`);
        }
        const data = await response.json();
        const clientesData = getDataArray<Cliente>(data);

        setClientes(clientesData);
        setVisibleClients(clientesData);
        setProfilesCache(
          Object.fromEntries(
            clientesData.map((cliente) => [cliente.codUsuario, cliente]),
          ),
        );
      } catch (error) {
        console.error("Error fetching clients:", error);
        toast.error("Error al cargar los clientes");
        setClientes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClientes();
  }, []);

  const fetchProfile = async (codUsuario: string) => {
    try {
      // avoid re-fetching if it's already in the cache
      if (profilesCache[codUsuario]) return profilesCache[codUsuario];

      const res = await apiFetch(`/usuarios/profiles/${codUsuario}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      // backend wraps profile in { success: true, data: user }
      const profileData =
        isRecord(json) && "data" in json
          ? (json as { data?: unknown }).data
          : json;
      const profile = profileData as ClienteProfile;
      setProfilesCache((prev) => ({ ...prev, [codUsuario]: profile }));
      return profile;
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("No se pudo obtener el perfil");
      return null;
    }
  };

  const toggleExpand = async (codUsuario: string) => {
    if (expandedClient === codUsuario) {
      setExpandedClient(null);
      return;
    }

    await fetchProfile(codUsuario);
    setExpandedClient(codUsuario);
  };

  // fetch categories for the filtering
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const res = await apiFetch(`/categorias`);
        if (!res.ok) {
          const errorData = await readJsonSafely(res);
          const text = JSON.stringify(errorData ?? {});
          console.error("/categorias error body:", text);
          throw new Error(`HTTP ${res.status} - ${text}`);
        }
        const json = await res.json();
        const categoriasData =
          getDataArray<Category>(json).filter(isCategoria);
        setCategorias(categoriasData);
      } catch (error) {
        console.error("Error fetching categorias:", error);
      }
    };

    fetchCategorias();
  }, []);

  useEffect(() => {
    const applyFilter = async () => {
      if (selectedCategoria === "all") {
        setVisibleClients(clientes);
        return;
      }

      const filtered = clientes.filter((c) => {
        const prof = profilesCache[c.codUsuario] ?? c;
        return prof?.categoriaActual?.codCategoria === selectedCategoria;
      });

      setVisibleClients(filtered);
    };

    applyFilter();
  }, [selectedCategoria, clientes, profilesCache]);

  if (loading)
    return <div className={styles.loading}>Cargando clientes...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Listado de Clientes</h2>
        <div className={styles.headerRow}>
          <br />
          <div className={styles.filterRow}>
            <label className={styles.filterLabel} htmlFor="categoriaSelect">
              Filtrar por categoría:
            </label>
            <select
              id="categoriaSelect"
              className={styles.select}
              value={selectedCategoria}
              onChange={(e) => setSelectedCategoria(e.target.value)}
            >
              <option value="all">Todas</option>
              {categorias.map((cat) => (
                <option key={cat.codCategoria} value={cat.codCategoria}>
                  {cat.nombreCategoria}
                </option>
              ))}
            </select>
            <div className={styles.countBadge}>{visibleClients.length}</div>
          </div>
        </div>

        <div className={styles.cardList}>
          {visibleClients.length === 0 ? (
            <div className={styles.empty}>No hay clientes</div>
          ) : (
            visibleClients.map((cliente) => (
              <div key={cliente.codUsuario} className={styles.clientCard}>
                <div className={styles.clientTop}>
                  <div>
                    <div className={styles.smallMuted}>DNI: {cliente.dni}</div>
                    <div>
                      {cliente.nombre} {cliente.apellido}
                    </div>
                    <div className={styles.smallMuted}>
                      Turnos:{" "}
                      {cliente.appointmentCounts?.total ?? 0}{" "}
                      &nbsp;(Cancel.:{" "}
                      {cliente.appointmentCounts?.canceled ?? 0})
                    </div>
                  </div>
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnView}`}
                      onClick={() => toggleExpand(cliente.codUsuario)}
                    >
                      {expandedClient === cliente.codUsuario
                        ? "Ver menos"
                        : "Ver más"}
                    </button>
                  </div>
                </div>

                {expandedClient === cliente.codUsuario && (
                  <div className={styles.clientProfile}>
                    {profilesCache[cliente.codUsuario] ? (
                      <div className={styles.profileInner}>
                        <p>
                          <strong>Nombre:</strong>{" "}
                          {profilesCache[cliente.codUsuario].nombre}{" "}
                          {profilesCache[cliente.codUsuario].apellido}
                        </p>
                        <p>
                          <strong>DNI:</strong>{" "}
                          {profilesCache[cliente.codUsuario].dni}
                        </p>
                        <p>
                          <strong>Teléfono:</strong>{" "}
                          {profilesCache[cliente.codUsuario].telefono ?? "-"}
                        </p>
                        <p>
                          <strong>Email:</strong>{" "}
                          {profilesCache[cliente.codUsuario].email ?? "-"}
                        </p>
                        <p>
                          <strong>Categoría actual:</strong>{" "}
                          {profilesCache[cliente.codUsuario].categoriaActual
                            ?.nombreCategoria ?? "-"}
                        </p>
                        <p>
                          <strong>Fecha inicio categoría:</strong>{" "}
                          {formatDateISO(
                            profilesCache[cliente.codUsuario].categoriaActual
                              ?.fechaInicio,
                          )}
                        </p>
                      </div>
                    ) : (
                      <div>Cargando perfil...</div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* desktop */}
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>DNI</th>
                <th>Turnos (cancel.)</th>
                <th>Nombre</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibleClients.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.empty}>
                    No hay clientes
                  </td>
                </tr>
              ) : (
                visibleClients.map((cliente) => (
                  <React.Fragment key={cliente.codUsuario}>
                    <tr>
                      <td>{cliente.dni}</td>
                      <td>
                        {cliente.appointmentCounts?.total ?? 0} (
                        {cliente.appointmentCounts?.canceled ?? 0})
                      </td>
                      <td>
                        {cliente.nombre} {cliente.apellido}
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <button
                            type="button"
                            className={`${styles.btn} ${styles.btnView}`}
                            onClick={() => toggleExpand(cliente.codUsuario)}
                          >
                            {expandedClient === cliente.codUsuario
                              ? "Ver menos"
                              : "Ver más"}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {expandedClient === cliente.codUsuario && (
                      <tr>
                        <td colSpan={5}>
                          <div className={styles.clientProfile}>
                            {profilesCache[cliente.codUsuario] ? (
                              <div className={styles.profileInner}>
                                <p>
                                  <strong>Nombre:</strong>{" "}
                                  {profilesCache[cliente.codUsuario].nombre}{" "}
                                  {profilesCache[cliente.codUsuario].apellido}
                                </p>
                                <p>
                                  <strong>DNI:</strong>{" "}
                                  {profilesCache[cliente.codUsuario].dni}
                                </p>
                                <p>
                                  <strong>Teléfono:</strong>{" "}
                                  {profilesCache[cliente.codUsuario].telefono ??
                                    "-"}
                                </p>
                                <p>
                                  <strong>Email:</strong>{" "}
                                  {profilesCache[cliente.codUsuario].email ??
                                    "-"}
                                </p>
                                <p>
                                  <strong>Categoría actual:</strong>{" "}
                                  {profilesCache[cliente.codUsuario]
                                    .categoriaActual?.nombreCategoria ?? "-"}
                                </p>
                                <p>
                                  <strong>Fecha inicio categoría:</strong>{" "}
                                  {formatDateISO(
                                    profilesCache[cliente.codUsuario]
                                      .categoriaActual?.fechaInicio,
                                  )}
                                </p>
                              </div>
                            ) : (
                              <div>Cargando perfil...</div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default IndexClients;
