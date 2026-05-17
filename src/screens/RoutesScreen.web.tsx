import React, { useCallback, useEffect, useMemo } from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import AppButton from "../components/ui/AppButton";
import AppCard from "../components/ui/AppCard";
import EmptyState from "../components/ui/EmptyState";
import StatCard from "../components/ui/StatCard";
import type { CollectionPoint } from "../domain/types/collectionPoint";
import { useRoutesStore } from "../state/useRoutesStore";
import { buildGoogleMapsDirectionsUrl } from "../utils/maps";
import colors from "../styles/colors";
import globalStyles from "../styles/globalStyles";

function getPointDescription(point: CollectionPoint): string {
  return point.address ?? point.materialType ?? "Ponto de reciclavel";
}

function formatDistance(distanceMeters: number | null): string {
  if (distanceMeters == null) {
    return "--";
  }

  return `${(distanceMeters / 1000).toFixed(1)} km`;
}

function formatDuration(durationSeconds: number | null): string {
  if (durationSeconds == null) {
    return "--";
  }

  const totalMinutes = Math.round(durationSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  return `${hours}h ${minutes}min`;
}

const RoutesScreen = (): React.JSX.Element => {
  const currentLocation = useRoutesStore((state) => state.currentLocation);
  const points = useRoutesStore((state) => state.points);
  const selectedPoint = useRoutesStore((state) => state.selectedPoint);
  const plannedRoute = useRoutesStore((state) => state.plannedRoute);
  const isLoading = useRoutesStore((state) => state.isLoading);
  const error = useRoutesStore((state) => state.error);
  const locationPermissionDenied = useRoutesStore(
    (state) => state.locationPermissionDenied,
  );
  const lastLoadUsedCache = useRoutesStore((state) => state.lastLoadUsedCache);
  const refreshPoints = useRoutesStore((state) => state.refreshPoints);
  const selectPoint = useRoutesStore((state) => state.selectPoint);

  useEffect(() => {
    void refreshPoints();
  }, [refreshPoints]);

  const handleOpenDirections = useCallback(async () => {
    if (!selectedPoint) {
      return;
    }

    await Linking.openURL(
      buildGoogleMapsDirectionsUrl(
        selectedPoint.latitude,
        selectedPoint.longitude,
      ),
    );
  }, [selectedPoint]);

  const topPoints = useMemo(() => points.slice(0, 8), [points]);

  return (
    <ScrollView
      style={globalStyles.container}
      contentContainerStyle={globalStyles.screenContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <Text style={globalStyles.sectionEyebrow}>Mapa web simplificado</Text>
        <Text style={styles.heroTitle}>Rotas e pontos proximos.</Text>
        <Text style={styles.heroSubtitle}>
          Na web, o app mostra uma experiencia leve em lista. No mobile nativo, o mapa abre com os marcadores.
        </Text>

        <View style={styles.metricsRow}>
          <StatCard value={String(points.length)} label="pontos carregados" />
          <StatCard
            value={lastLoadUsedCache ? "Offline" : "Online"}
            label="modo atual"
          />
          <StatCard
            value={plannedRoute?.provider === "osrm" ? "OSRM" : "Fallback"}
            label="roteirizacao"
          />
        </View>
      </View>

      {plannedRoute && (
        <AppCard style={styles.summaryCard}>
          <Text style={globalStyles.sectionEyebrow}>Rota calculada</Text>
          <Text style={styles.summaryTitle}>
            {formatDistance(plannedRoute.distanceMeters)} • {formatDuration(plannedRoute.durationSeconds)}
          </Text>
          <Text style={styles.summaryText}>
            {plannedRoute.provider === "osrm"
              ? "A ordem abaixo foi calculada com roteamento real via OSRM."
              : "A ordem abaixo esta em fallback porque a API nao respondeu agora."}
          </Text>
        </AppCard>
      )}

      <AppCard style={styles.mapPlaceholder}>
        <View style={styles.mapPlaceholderIcon}>
          <Ionicons name="map-outline" size={34} color={colors.primary} />
        </View>
        <Text style={styles.mapPlaceholderTitle}>Visao resumida dos pontos</Text>
        <Text style={styles.mapPlaceholderText}>
          Esta tela evita carregar o modulo nativo de mapas no navegador e preserva a navegacao rapida.
        </Text>
        {currentLocation && (
          <Text style={styles.coordinatesText}>
            Sua referencia atual: {currentLocation.latitude.toFixed(5)},{" "}
            {currentLocation.longitude.toFixed(5)}
          </Text>
        )}
      </AppCard>

      <AppButton
        label="Atualizar pontos proximos"
        iconName="refresh"
        onPress={() => void refreshPoints()}
        disabled={isLoading}
        style={styles.refreshButton}
      />

      {locationPermissionDenied && (
        <Text style={styles.warningText}>
          Permissao de localizacao negada. O app continua usando pontos salvos.
        </Text>
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.listSection}>
        <Text style={globalStyles.sectionEyebrow}>Lista priorizada</Text>
        <Text style={styles.listTitle}>Pontos para explorar</Text>
      </View>

      {topPoints.length === 0 && !isLoading && (
        <EmptyState
          title="Nenhum ponto encontrado"
          description="Atualize quando estiver online ou permita a localizacao para buscar pontos proximos."
          iconName="map-outline"
        />
      )}

      <View style={styles.pointsColumn}>
        {topPoints.map((point, index) => (
          <TouchableOpacity
            key={point.id}
            style={[
              styles.pointCard,
              selectedPoint?.id === point.id ? styles.pointCardActive : null,
            ]}
            onPress={() => selectPoint(point)}
          >
            <View style={styles.pointIndexWrap}>
              <Text style={styles.pointIndex}>{String(index + 1).padStart(2, "0")}</Text>
            </View>
            <View style={styles.pointBody}>
              <Text style={styles.pointTitle}>{point.name}</Text>
              <Text style={styles.pointText}>{getPointDescription(point)}</Text>
              <Text style={styles.pointCoordinates}>
                {point.latitude.toFixed(5)}, {point.longitude.toFixed(5)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>

      {selectedPoint && (
        <AppCard style={styles.detailCard}>
          <Text style={styles.detailTitle}>{selectedPoint.name}</Text>
          <Text style={styles.detailText}>{getPointDescription(selectedPoint)}</Text>
          <Text style={styles.futureHint}>
            Quando integrarmos uma API de rotas, esta area pode mostrar distancia, tempo e ordem ideal de visita.
          </Text>

          <View style={styles.actionsRow}>
            <AppButton
              label="Fechar"
              variant="secondary"
              onPress={() => selectPoint(null)}
              style={styles.secondaryButton}
            />
            <AppButton
              label="Como chegar"
              iconName="navigate-outline"
              onPress={() => void handleOpenDirections()}
              style={styles.primaryButton}
            />
          </View>
        </AppCard>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
    marginTop: 10,
  },
  heroSubtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  metricsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 18,
  },
  mapPlaceholder: {
    backgroundColor: colors.primarySoft,
    borderRadius: 24,
    padding: 22,
    marginBottom: 16,
  },
  mapPlaceholderIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  mapPlaceholderTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
    marginTop: 16,
  },
  mapPlaceholderText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  coordinatesText: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 10,
  },
  refreshButton: {
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 16,
  },
  summaryTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
    marginTop: 4,
  },
  summaryText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  warningText: {
    color: colors.text,
    fontSize: 13,
    marginTop: 12,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    marginTop: 10,
  },
  listSection: {
    marginTop: 20,
  },
  listTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
    marginTop: 4,
  },
  pointsColumn: {
    gap: 10,
    marginTop: 14,
  },
  pointCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
  },
  pointCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  pointIndexWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
    marginRight: 12,
  },
  pointIndex: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800",
  },
  pointBody: {
    flex: 1,
  },
  pointTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  pointText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  pointCoordinates: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 6,
  },
  detailCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 18,
  },
  detailTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  detailText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
  },
  futureHint: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 12,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  primaryButton: {
    flex: 1,
  },
});

export default RoutesScreen;
