import { describe, expect, it } from "@jest/globals";

import { buildGoogleMapsDirectionsUrl } from "../maps";

describe("buildGoogleMapsDirectionsUrl", () => {
  it("deve montar URL de rota externa do Google Maps", () => {
    expect(buildGoogleMapsDirectionsUrl(-23.55, -46.63)).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=-23.55,-46.63",
    );
  });
});
