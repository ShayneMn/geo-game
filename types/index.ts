import type {
  FeatureCollection,
  Feature,
  Geometry,
  GeometryObject,
} from "geojson";

export type CountryProperties = { name: string };
export type CountryFeature = Feature<Geometry, CountryProperties>;
export type CountryFeatureCollection = FeatureCollection<Geometry, CountryProperties>;

export type TopoCountryGeometry = GeometryObject & {
  properties?: CountryProperties;
};

export type CountryMeta = {
  belongsTo?: string;
};

export type Country = {
  name: string;
  meta: CountryMeta;
};