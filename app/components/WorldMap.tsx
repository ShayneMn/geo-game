"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { feature, mesh } from "topojson-client";
import type { FeatureCollection, Feature, Geometry } from "geojson";
import type {
  Topology,
  GeometryCollection,
} from "topojson-specification";

type CountryProperties = {
  name: string;
};

type CountryFeature = Feature<Geometry, CountryProperties>;
type CountryFeatureCollection = FeatureCollection<
  Geometry,
  CountryProperties
>;

type WorldMapProps = {
  targetCountry: string;
  onCorrect: () => void;
};

export default function WorldMap({
  targetCountry,
  onCorrect,
}: WorldMapProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<SVGGElement | null>(null);

  const [worldData, setWorldData] =
    useState<CountryFeatureCollection | null>(null);
  const [topologyData, setTopologyData] = useState<Topology<{
    countries: GeometryCollection<CountryProperties>;
  }> | null>(null);

  const [selectedCountry, setSelectedCountry] = useState<
    string | null
  >(null);
  const [previousCountries, setPreviousCountries] = useState<
    string[]
  >([]);

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
    if (
      !svgRef.current ||
      !containerRef.current ||
      !worldData ||
      !topologyData
    )
      return;

    const svg = d3.select<SVGSVGElement, undefined>(svgRef.current);
    const container = d3.select(containerRef.current);

    container.selectAll("*").remove();

    const projection = d3
      .geoEquirectangular()
      .fitSize([width, height], worldData)
      .clipExtent([
        [0, 0],
        [width, height],
      ]);

    const pathGenerator = d3.geoPath(projection);

    const leftEdge = projection([-180, 0]);
    const rightEdge = projection([180, 0]);
    const worldWidth =
      leftEdge && rightEdge ? rightEdge[0] - leftEdge[0] : width;

    [-1, 0, 1].forEach((copyIndex) => {
      const group = container
        .append("g")
        .attr("class", "world-copy")
        .attr(
          "transform",
          `translate(${copyIndex * (worldWidth - baseStroke)}, 0)`,
        );

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
          setSelectedCountry(name);
          if (name === targetCountry) {
            setPreviousCountries((prev) => [...prev, name]);
            setTimeout(() => onCorrect(), 600);
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
      .on(
        "zoom",
        (event: d3.D3ZoomEvent<SVGSVGElement, undefined>) => {
          const { x, y, k } = event.transform;
          const scaledWorldWidth = (worldWidth - baseStroke) * k;
          const normalizedX =
            ((x % scaledWorldWidth) + scaledWorldWidth) %
            scaledWorldWidth;

          container
            .selectAll<SVGGElement, undefined>(".world-copy")
            .attr("transform", (_, i) => {
              const offsetIndex = i - 1;
              const offsetX =
                normalizedX + offsetIndex * scaledWorldWidth;
              return `translate(${offsetX}, ${y}) scale(${k})`;
            });
        },
      );

    svg.call(zoomBehavior);
  }, [worldData, topologyData, targetCountry, onCorrect]);

  useEffect(() => {
    if (!containerRef.current) return;

    d3.select(containerRef.current)
      .selectAll<SVGPathElement, CountryFeature>(".country")
      .attr("fill", (d) => {
        const name = d.properties?.name ?? "Unknown";
        if (
          (name === selectedCountry && name === targetCountry) ||
          previousCountries.includes(name)
        ) {
          return "#22c55e";
        } else if (
          name !== targetCountry &&
          name === selectedCountry
        ) {
          return "#ef4444";
        } else {
          return "#ffffff";
        }
      });
  }, [previousCountries, selectedCountry, targetCountry]);

  if (!worldData) return <div>Loading map...</div>;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-full bg-[#c9e9fb]"
      shapeRendering="geometricPrecision"
    >
      <g ref={containerRef} />
    </svg>
  );
}
