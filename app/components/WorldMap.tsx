"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { feature, mesh } from "topojson-client";
import type { FeatureCollection, Feature, Geometry } from "geojson";
import type { Topology, GeometryCollection } from "topojson-specification";

type CountryProperties = { name: string };
type CountryFeature = Feature<Geometry, CountryProperties>;
type CountryFeatureCollection = FeatureCollection<Geometry, CountryProperties>;

type WorldMapProps = {
  targetCountry: string;
  onCorrect: () => void;
};

export default function WorldMap({ targetCountry, onCorrect }: WorldMapProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const outerRef = useRef<SVGGElement | null>(null);

  const targetCountryRef = useRef(targetCountry);
  const onCorrectRef = useRef(onCorrect);

  useEffect(() => {
    targetCountryRef.current = targetCountry;
  }, [targetCountry]);

  useEffect(() => {
    onCorrectRef.current = onCorrect;
  }, [onCorrect]);

  const [worldData, setWorldData] = useState<CountryFeatureCollection | null>(
    null,
  );
  const [topologyData, setTopologyData] = useState<Topology<{
    countries: GeometryCollection<CountryProperties>;
  }> | null>(null);

  const [selection, setSelection] = useState<{
    country: string;
    forTarget: string;
  } | null>(null);
  const [correctCountries, setCorrectCountries] = useState<Set<string>>(
    new Set(),
  );

  const selectedCountry =
    selection?.forTarget === targetCountry ? selection.country : null;

  const zoomTransformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<
    SVGSVGElement,
    undefined
  > | null>(null);
  const worldWidthRef = useRef<number>(0);

  const width = 1000;
  const height = 550;
  const baseStroke = 0.5;

  useEffect(() => {
    fetch("/data/worldmap.json")
      .then((res) => res.json())
      .then(
        (
          topology: Topology<{
            countries: GeometryCollection<CountryProperties>;
          }>,
        ) => {
          const geo = feature(
            topology,
            topology.objects.countries,
          ) as CountryFeatureCollection;

          setTopologyData(topology);
          setWorldData(geo);
        },
      );
  }, []);

  useEffect(() => {
    if (!svgRef.current || !outerRef.current || !worldData || !topologyData)
      return;

    const svg = d3.select<SVGSVGElement, undefined>(svgRef.current);
    const outer = d3.select(outerRef.current);

    outer.selectAll("*").remove();

    const projection = d3
      .geoEquirectangular()
      .fitSize([width, height], worldData)
      .clipExtent([
        [-width, -height],
        [width * 2, height * 2],
      ]);

    const pathGenerator = d3.geoPath(projection);

    const worldWidth = 2 * Math.PI * projection.scale();
    worldWidthRef.current = worldWidth;

    [-1, 0, 1].forEach((copyIndex) => {
      const group = outer
        .append("g")
        .attr("class", "world-copy")
        .attr("transform", `translate(${copyIndex * worldWidth}, 0)`);

      group
        .selectAll<SVGPathElement, CountryFeature>("path.country")
        .data(worldData.features)
        .enter()
        .append("path")
        .attr("class", "country")
        .attr("d", (d) => pathGenerator(d) ?? "")
        .attr("fill", "#ffffff")
        .style("cursor", "pointer")
        .on("click", (_, d) => {
          const name = d.properties?.name ?? "Unknown";
          const target = targetCountryRef.current;
          setSelection({ country: name, forTarget: target });
          if (name === target) {
            setCorrectCountries((prev) => new Set([...prev, name]));
            setTimeout(() => onCorrectRef.current(), 300);
          }
        });

      const borders = mesh(
        topologyData,
        topologyData.objects.countries,
        () => true,
      );

      group
        .append("path")
        .attr("d", pathGenerator(borders) ?? "")
        .attr("fill", "none")
        .attr("stroke", "#374151")
        .attr("stroke-width", baseStroke)
        .attr("stroke-opacity", 0.4)
        .attr("vector-effect", "non-scaling-stroke")
        .attr("pointer-events", "none");
    });

    const zoomBehavior = d3
      .zoom<SVGSVGElement, undefined>()
      .scaleExtent([1, 100])
      .translateExtent([
        [-Infinity, -80],
        [Infinity, height + 80],
      ])
      .on("zoom", (event) => {
        const { x, y, k } = event.transform;
        zoomTransformRef.current = event.transform;

        const ww = worldWidthRef.current;
        const scaledWorldWidth = ww * k;

        const normalizedX =
          ((x % scaledWorldWidth) + scaledWorldWidth) % scaledWorldWidth;

        d3.select(outerRef.current).attr(
          "transform",
          `translate(${normalizedX}, ${y}) scale(${k})`,
        );
      });

    zoomBehaviorRef.current = zoomBehavior;

    svg.call(zoomBehavior);
    svg.call(zoomBehavior.transform, zoomTransformRef.current);
  }, [worldData, topologyData]);

  useEffect(() => {
    if (!outerRef.current) return;

    d3.select(outerRef.current)
      .selectAll<SVGPathElement, CountryFeature>(".country")
      .attr("fill", (d) => {
        const name = d.properties?.name ?? "Unknown";

        if (correctCountries.has(name)) return "#22c55e";

        if (name === selectedCountry) {
          return name === targetCountry ? "#22c55e" : "#ef4444";
        }

        return "#ffffff";
      });
  }, [correctCountries, selectedCountry, targetCountry]);

  if (!worldData) return <div>Loading map...</div>;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-full bg-[#c9e9fb]"
      shapeRendering="geometricPrecision"
    >
      <g ref={outerRef} />
    </svg>
  );
}
