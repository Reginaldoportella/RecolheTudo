import React, { useCallback, useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";

import type { CollectionPoint } from "../domain/types/collectionPoint";
import { useRoutesStore } from "../state/useRoutesStore";
import { buildGoogleMapsDirectionsUrl } from "../utils/maps";
import colors from "../styles/colors";

const DEFAULT_REGION = {
  latitude: -15.793889,
  longitude: -47.882778,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

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

  const mapRegion = currentLocation
    ? {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      }
    : DEFAULT_REGION;

  const closestPoint = useMemo(() => points[0] ?? null, [points]);

  return (
    <View style={styles.screen}>
      <MapView
        key={currentLocation ? "with-current-location" : "default-location"}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={mapRegion}
        showsUserLocation={currentLocation !== null}
        showsMyLocationButton
      >
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            title="Sua localizacao"
            pinColor={colors.secondary}
          />
        )}

        {points.map((point) => (
          <Marker
            key={point.id}
            coordinate={{
              latitude: point.latitude,
              longitude: point.longitude,
            }}
            title={point.name}
            description={getPointDescription(point)}
            pinColor={point.source === "osm" ? colors.primary : colors.accent}
            onPress={() => selectPoint(point)}
          />
        ))}
      </MapView>

      <View style={styles.topOverlay}>
        <View style={styles.topCard}>
          <View style={styles.topCardHeader}>
            <View style={styles.topCardTitleWrap}>
              <Text style={styles.topEyebrow}>Rotas</Text>
              <Text style={styles.topTitle}>Planeje sua proxima parada</Text>
            </View>

            <TouchableOpacity
              style={styles.refreshButton}
              onPress={() => void refreshPoints()}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.textLight} />
              ) : (
                <Ionicons name="refresh" size={20} color={colors.textLight} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.metricsRow}>
            <View style={styles.metricPill}>
              <Text style={styles.metricPillValue}>{points.length}</Text>
              <Text style={styles.metricPillLabel}>paradas</Text>
            </View>
            <View style={styles.metricPill}>
              <Text style={styles.metricPillValue}>
                {lastLoadUsedCache ? "Offline" : "Online"}
              </Text>
              <Text style={styles.metricPillLabel}>fonte atual</Text>
            </View>
            <View style={styles.metricPill}>
              <Text style={styles.metricPillValue}>
                {plannedRoute?.provider === "osrm" ? "OSRM" : "Fallback"}
              </Text>
              <Text style={styles.metricPillLabel}>roteirizacao</Text>
            </View>
          </View>

          {closestPoint && (
            <Text style={styles.inlineHint}>Primeiro destaque: {closestPoint.name}</Text>
          )}

          {locationPermissionDenied && (
            <Text style={styles.warningText}>
              Permissao de localizacao negada. O app mostra pontos salvos localmente.
            </Text>
          )}
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      </View>

      {plannedRoute && (
        <View style={styles.routeSummaryOverlay}>
          <View style={styles.routeSummaryCard}>
            <Text style={styles.routeSummaryEyebrow}>Rota sugerida</Text>
            <Text style={styles.routeSummaryTitle}>
              {formatDistance(plannedRoute.distanceMeters)} • {formatDuration(plannedRoute.durationSeconds)}
            </Text>
            <Text style={styles.routeSummaryText}>
              {plannedRoute.provider === "osrm"
                ? "Ordem calculada por rota real de vias."
                : "Ordem mantida como fallback enquanto a API nao respondeu."}
            </Text>
          </View>
        </View>
      )}

      {!selectedPoint && points.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bottomListContent}
          style={styles.bottomList}
        >
          {points.slice(0, 10).map((point, index) => (
            <TouchableOpacity
              key={point.id}
              style={[
                styles.pointCard,
                index === 0 ? styles.pointCardFeatured : null,
              ]}
              onPress={() => selectPoint(point)}
            >
              <Text style={styles.pointCardIndex}>{String(index + 1).padStart(2, "0")}</Text>
              <Text style={styles.pointCardTitle} numberOfLines={1}>
                {point.name}
              </Text>
              <Text style={styles.pointCardText} numberOfLines={2}>
                {getPointDescription(point)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {points.length === 0 && !isLoading && (
        <View style={styles.emptySheet}>
          <Text style={styles.emptyTitle}>Nenhum ponto encontrado</Text>
          <Text style={styles.emptyText}>
            Atualize quando estiver online ou permita a localizacao para buscar pontos proximos.
          </Text>
        </View>
      )}

      {selectedPoint && (
        <View style={styles.detailSheet}>
          <View style={styles.detailHandle} />
          <Text style={styles.detailTitle}>{selectedPoint.name}</Text>
          <Text style={styles.detailText}>{getPointDescription(selectedPoint)}</Text>
          <Text style={styles.detailCoordinates}>
            {selectedPoint.latitude.toFixed(5)}, {selectedPoint.longitude.toFixed(5)}
          </Text>

          <View style={styles.detailTags}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>
                {selectedPoint.source === "osm" ? "Origem OSM" : "Origem local"}
              </Text>
            </View>
            {selectedPoint.materialType ? (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{selectedPoint.materialType}</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.futureHint}>
            Proximo passo de produto: calcular ordem ideal entre varios pontos usando API de rotas.
          </Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.sheetButton, styles.sheetButtonSecondary]}
              onPress={() => selectPoint(null)}
            >
              <Text style={styles.sheetButtonSecondaryText}>Fechar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sheetButton, styles.sheetButtonPrimary]}
              onPress={() => void handleOpenDirections()}
            >
              <Ionicons name="navigate" size={18} color={colors.textLight} />
              <Text style={styles.sheetButtonPrimaryText}>Como chegar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  map: {
    flex: 1,
    width: "100%",
  },
  topOverlay: {
    position: "absolute",
    top: 18,
    left: 16,
    right: 16,
  },
  routeSummaryOverlay: {
    position: "absolute",
    top: 192,
    left: 16,
    right: 16,
  },
  topCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topCardTitleWrap: {
    flex: 1,
    paddingRight: 12,
  },
  topEyebrow: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  topTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
    marginTop: 4,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  metricPill: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricPillValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  metricPillLabel: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  inlineHint: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 12,
  },
  warningText: {
    color: colors.text,
    fontSize: 12,
    marginTop: 10,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 10,
  },
  routeSummaryCard: {
    backgroundColor: "rgba(255, 253, 248, 0.96)",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  routeSummaryEyebrow: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  routeSummaryTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 4,
  },
  routeSummaryText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  bottomList: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 16,
    maxHeight: 150,
  },
  bottomListContent: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 12,
  },
  pointCard: {
    width: 220,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pointCardFeatured: {
    backgroundColor: colors.primaryStrong,
    borderColor: colors.primaryStrong,
  },
  pointCardIndex: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  pointCardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
    marginTop: 8,
  },
  pointCardText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  emptySheet: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 18,
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
  },
  detailSheet: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 18,
    backgroundColor: colors.surface,
    borderRadius: 26,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailHandle: {
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: 14,
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
  detailCoordinates: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 8,
  },
  detailTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  tag: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },
  futureHint: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 14,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  sheetButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  sheetButtonSecondary: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sheetButtonPrimary: {
    backgroundColor: colors.primary,
  },
  sheetButtonSecondaryText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  sheetButtonPrimaryText: {
    color: colors.textLight,
    fontSize: 15,
    fontWeight: "800",
  },
});

export default RoutesScreen;
