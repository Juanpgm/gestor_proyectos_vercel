declare module "shapefile" {
  interface Source {
    read(): Promise<{ done: true } | { done: false; value: unknown }>;
  }
  function open(
    shp: ArrayBuffer | string,
    dbf?: ArrayBuffer | string
  ): Promise<Source>;
  function read(
    shp: ArrayBuffer | string,
    dbf?: ArrayBuffer | string
  ): Promise<{ type: "FeatureCollection"; features: unknown[] }>;
}
