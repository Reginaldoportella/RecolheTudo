import React, { useCallback, useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";

import AppCard from "../components/ui/AppCard";
import EmptyState from "../components/ui/EmptyState";
import PrimaryButton from "../components/ui/PrimaryButton";
import RouteSuggestionCard from "../components/ui/RouteSuggestionCard";
import { useRoutesStore } from "../state/useRoutesStore";
import { buildGoogleMapsDirectionsUrl } from "../utils/maps";
import colors from "../styles/colors";

const DEFAULT_REGION = {
  latitude: -15.793889,
  longitude: -47.882778,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

function getPointDescription(point: {
  address: string | null;
  materialType: string | null;
}): string {
  return point.address ?? point.materialType ?? "Ponto de coleta";
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

function decodePolyline(polyline: string | null): Array<{ latitude: number; longitude: number }> {
  if (!polyline) {
    return [];
  }

  let index = 0;
  let latitude = 0;
  let longitude = 0;
  const coordinates: Array<{ latitude: number; longitude: number }> = [];

  while (index < polyline.length) {
    let shift = 0;
    let result = 0;
    let byte = 0;

    do {
      byte = polyline.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLatitude = result & 1 ? ~(result >> 1) : result >> 1;
    latitude += deltaLatitude;

    shift = 0;
    result = 0;

    do {
      byte = polyline.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLongitude = result & 1 ? ~(result >> 1) : result >> 1;
    longitude += deltaLongitude;

    coordinates.push({
      latitude: latitude / 1e5,
      longitude: longitude / 1e5,
    });
  }

  return coordinates;
}

function getProviderLabel(provider: "none" | "osrm" | "mapbox" | "google"): string {
  if (provider === "osrm") {
    return "Rota otimizada com apoio do servico de percurso.";
  }

  if (provider === "google") {
    return "Rota sugerida com apoio do Google.";
  }

  if (provider === "mapbox") {
    return "Rota sugerida com apoio do Mapbox.";
  }

  return "Rota simples montada no aparelho para nao travar seu fluxo.";
}

const RoutesScreen = (): React.JSX.Element => {
  const { width } = useWindowDimensions();
  const isWide = width >= 980;
  const currentLocation = useRoutesStore((state) => state.currentLocation);
  const points = useRoutesStore((state) => state.points);
  const plannedRoute = useRoutesStore((state) => state.plannedRoute);
  const isLoading = useRoutesStore((state) => state.isLoading);
  const error = useRoutesStore((state) => state.error);
  const refreshPoints = useRoutesStore((state) => state.refreshPoints);
  const lastLoadUsedCache = useRoutesStore((state) => state.lastLoadUsedCache);

  useEffect(() => {
    void refreshPoints();
  }, [refreshPoints]);

  const routePoints = plannedRoute?.orderedPoints.length
    ? plannedRoute.orderedPoints
    : points;

  const routeCoordinates = useMemo(
    () => decodePolyline(plannedRoute?.polyline ?? null),
    [plannedRoute?.polyline],
  );

  const firstPoint = routePoints[0] ?? null;
  const provider = plannedRoute?.provider ?? "none";
  const isFallbackRoute = provider === "none" || routeCoordinates.length < 2;
  const routeSummaryText = firstPoint
    ? `Comece por ${firstPoint.name} e siga a ordem sugerida para ganhar tempo no percurso.`
    : "Busque pontos proximos para montar sua primeira rota do dia.";
  const sourceLabel = lastLoadUsedCache
    ? "Usando pontos salvos no aparelho"
    : "Usando pontos atualizados da busca mais recente";

  const handleStartRoute = useCallback(async () => {
    if (!firstPoint) {
      return;
    }

    await Linking.openURL(
      buildGoogleMapsDirectionsUrl(firstPoint.latitude, firstPoint.longitude),
    );
  }, [firstPoint]);

  const mapRegion =
    currentLocation ?? firstPoint
      ? {
          latitude: (currentLocation ?? firstPoint)!.latitude,
          longitude: (currentLocation ?? firstPoint)!.longitude,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }
      : DEFAULT_REGION;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <Image
          source={require("../../assets/brand/brand-mark.png")}
          style={styles.heroLeaf}
          resizeMode="contain"
        />
        <Text style={styles.heroTitle}>Planejar rota</Text>
        <Text style={styles.heroDescription}>
          Organize os pontos de coleta e siga um percurso mais eficiente no seu dia.
        </Text>
        <View style={styles.heroMetaRow}>
          <View style={styles.heroPill}>
            <Text style={styles.heroPillText}>Rota do dia</Text>
          </View>
          <View style={styles.heroPillMuted}>
            <Ionicons name="navigate-outline" size={14} color={colors.textLight} />
            <Text style={styles.heroPillText}>{routePoints.length} paradas</Text>
          </View>
        </View>
      </View>

      {isLoading ? (
        <AppCard>
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Montando rota sugerida...</Text>
          </View>
        </AppCard>
      ) : null}

      {routePoints.length === 0 && !isLoading ? (
        <EmptyState
          title="Nenhum ponto de coleta cadastrado ainda."
          description="Atualize quando estiver online ou permita a localizacao para buscar pontos proximos ao aparelho."
          iconName="map-outline"
          actionLabel="Atualizar agora"
          onAction={() => void refreshPoints()}
        />
      ) : null}

      {routePoints.length > 0 ? (
        <>
          <RouteSuggestionCard
            pointsCount={routePoints.length}
            distanceLabel={formatDistance(plannedRoute?.distanceMeters ?? null)}
            durationLabel={formatDuration(plannedRoute?.durationSeconds ?? null)}
            providerLabel={getProviderLabel(provider)}
            helperText={routeSummaryText}
            badgeLabel={isFallbackRoute ? "Modo simples" : "Rota otimizada"}
            onStart={() => {
              void handleStartRoute();
            }}
          />

          <View style={styles.insightRow}>
            <AppCard style={styles.insightCard}>
              <View style={styles.insightIcon}>
                <Ionicons name="flag-outline" size={18} color={colors.primaryStrong} />
              </View>
              <View style={styles.insightBody}>
                <Text style={styles.insightLabel}>Primeira parada</Text>
                <Text style={styles.insightValue}>
                  {firstPoint ? firstPoint.name : "Sem parada definida"}
                </Text>
                <Text style={styles.insightHelper}>
                  {firstPoint ? getPointDescription(firstPoint) : "Atualize os pontos para montar a rota"}
                </Text>
              </View>
            </AppCard>

            <AppCard style={styles.insightCard}>
              <View style={styles.insightIcon}>
                <Ionicons
                  name={lastLoadUsedCache ? "cloud-offline-outline" : "cloud-done-outline"}
                  size={18}
                  color={colors.primaryStrong}
                />
              </View>
              <View style={styles.insightBody}>
                <Text style={styles.insightLabel}>Origem dos dados</Text>
                <Text style={styles.insightValue}>{lastLoadUsedCache ? "Salvos no aparelho" : "Busca mais recente"}</Text>
                <Text style={styles.insightHelper}>{sourceLabel}</Text>
              </View>
            </AppCard>
          </View>

          <AppCard style={styles.routeCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Mapa do percurso</Text>
              <View style={styles.cardBadge}>
                <Text style={styles.cardBadgeText}>
                  {isFallbackRoute ? "Sem linha otimizada" : "Percurso otimizado"}
                </Text>
              </View>
            </View>

            <View style={[styles.mapWrap, { height: isWide ? 360 : 300 }]}>
              <MapView
                style={styles.map}
                provider={PROVIDER_DEFAULT}
                initialRegion={mapRegion}
                scrollEnabled={false}
                rotateEnabled={false}
                pitchEnabled={false}
                zoomEnabled={false}
              >
                {routePoints.map((point, index) => (
                  <Marker
                    key={point.id}
                    coordinate={{
                      latitude: point.latitude,
                      longitude: point.longitude,
                    }}
                    title={point.name}
                    description={getPointDescription(point)}
                  >
                    <View style={styles.markerBubble}>
                      <Text style={styles.markerText}>{index + 1}</Text>
                    </View>
                  </Marker>
                ))}
                {routeCoordinates.length > 1 ? (
                  <Polyline
                    coordinates={routeCoordinates}
                    strokeColor={colors.primary}
                    strokeWidth={5}
                  />
                ) : null}
              </MapView>
            </View>

            <Text style={styles.mapHelper}>
              {isFallbackRoute
                ? "O app montou uma ordem simples no aparelho para nao travar seu dia. Quando houver dados completos, a linha da rota aparece aqui."
                : "Use o mapa para entender a sequencia sugerida antes de sair para a rua."}
            </Text>
          </AppCard>

          <AppCard style={styles.pointsCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Pontos da rota</Text>
              <Text style={styles.cardCaption}>Siga a ordem para ganhar tempo no percurso</Text>
            </View>

            <View style={styles.pointsList}>
              {routePoints.map((point, index) => (
                <View key={point.id} style={styles.pointRow}>
                  <View style={styles.pointIndexColumn}>
                    <View style={styles.pointIndexBubble}>
                      <Text style={styles.pointIndexText}>{index + 1}</Text>
                    </View>
                    {index < routePoints.length - 1 ? <View style={styles.pointLine} /> : null}
                  </View>

                  <View style={styles.pointBody}>
                    <Text style={styles.pointTitle}>{point.name}</Text>
                    <Text style={styles.pointSubtitle}>{getPointDescription(point)}</Text>
                    {index === 0 ? (
                      <View style={styles.pointBadge}>
                        <Text style={styles.pointBadgeText}>Comece por aqui</Text>
                      </View>
                    ) : null}
                  </View>

                  <TouchableOpacity
                    style={styles.pointAction}
                    onPress={() =>
                      void Linking.openURL(
                        buildGoogleMapsDirectionsUrl(point.latitude, point.longitude),
                      )
                    }
                  >
                    <Ionicons name="location-outline" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                  <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </View>
              ))}
            </View>

            <PrimaryButton
              label="Iniciar rota"
              iconName="play-outline"
              onPress={() => {
                void handleStartRoute();
              }}
              style={styles.startButton}
            />
          </AppCard>

          <AppCard muted style={styles.helperCard}>
            <View style={styles.helperIcon}>
              <Ionicons name="scan-outline" size={22} color={colors.primaryStrong} />
            </View>
            <View style={styles.helperBody}>
              <Text style={styles.helperTitle}>Adicione mais pontos para melhorar a rota.</Text>
              <Text style={styles.helperText}>
                Quanto mais pontos relevantes, mais inteligente pode ficar a rota sugerida.
              </Text>
            </View>
          </AppCard>
        </>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 36,
    gap: 18,
  },
  hero: {
    backgroundColor: colors.primaryStrong,
    borderRadius: 30,
    padding: 24,
    overflow: "hidden",
  },
  heroLeaf: {
    position: "absolute",
    right: -20,
    top: -10,
    width: 240,
    height: 240,
    opacity: 0.36,
  },
  heroTitle: {
    color: colors.textLight,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
    maxWidth: 300,
  },
  heroDescription: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
    lineHeight: 24,
    marginTop: 14,
    maxWidth: 420,
  },
  heroMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 18,
  },
  heroPill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.16)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  heroPillMuted: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  heroPillText: {
    color: colors.textLight,
    fontSize: 13,
    fontWeight: "700",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  insightRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  insightCard: {
    flexGrow: 1,
    minWidth: 220,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  insightIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  insightBody: {
    flex: 1,
  },
  insightLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  insightValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 6,
  },
  insightHelper: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },
  routeCard: {
    gap: 18,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  cardCaption: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  cardBadge: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cardBadgeText: {
    color: colors.primaryStrong,
    fontSize: 12,
    fontWeight: "800",
  },
  mapWrap: {
    borderRadius: 24,
    overflow: "hidden",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  mapHelper: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  markerBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.textLight,
  },
  markerText: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: "800",
  },
  pointsCard: {
    gap: 16,
  },
  pointsList: {
    gap: 0,
  },
  pointRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 12,
  },
  pointIndexColumn: {
    alignItems: "center",
  },
  pointIndexBubble: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  pointIndexText: {
    color: colors.textLight,
    fontSize: 18,
    fontWeight: "800",
  },
  pointLine: {
    width: 2,
    flex: 1,
    minHeight: 24,
    backgroundColor: "#C7DEC9",
    marginTop: 6,
  },
  pointBody: {
    flex: 1,
    paddingTop: 4,
  },
  pointTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  pointSubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  pointBadge: {
    alignSelf: "flex-start",
    marginTop: 10,
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pointBadgeText: {
    color: colors.primaryStrong,
    fontSize: 11,
    fontWeight: "800",
  },
  pointAction: {
    paddingTop: 6,
  },
  startButton: {
    marginTop: 4,
  },
  helperCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  helperIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#EAF4E5",
    alignItems: "center",
    justifyContent: "center",
  },
  helperBody: {
    flex: 1,
  },
  helperTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  helperText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 6,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    lineHeight: 20,
  },
});

export default RoutesScreen;
