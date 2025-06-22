import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import Svg, { Circle, Line, Polygon, Text as SvgText, G } from 'react-native-svg';

interface SkillData {
  skill: string;
  current: number;
  target: number;
}

interface Props {
  skillProfile: SkillData[];
  size?: number;
}

const { width: screenWidth } = Dimensions.get('window');

export const RadarChart: React.FC<Props> = ({ skillProfile, size = 280 }) => {
  const centerX = size / 2;
  const centerY = size / 2;
  const maxRadius = size * 0.35;
  const innerRadius = maxRadius * 0.6;
  const centerRadius = maxRadius * 0.25;

  // Calculate positions for each skill around the circle
  const angleStep = (2 * Math.PI) / skillProfile.length;
  const skillPositions = skillProfile.map((skill, index) => {
    const angle = (index * angleStep) - (Math.PI / 2); // Start from top
    return {
      ...skill,
      angle,
      labelX: centerX + Math.cos(angle) * (maxRadius + 30),
      labelY: centerY + Math.sin(angle) * (maxRadius + 30),
      currentX: centerX + Math.cos(angle) * (innerRadius * (skill.current / skill.target)),
      currentY: centerY + Math.sin(angle) * (innerRadius * (skill.current / skill.target)),
    };
  });

  // Generate polygon points for current skill levels
  const currentPolygonPoints = skillPositions
    .map(pos => `${pos.currentX},${pos.currentY}`)
    .join(' ');

  return (
    <View style={styles.container}>
      {/* Target label at top */}
      <View style={[styles.targetLabel, { top: 10 }]}>
        <ThemedText style={styles.targetText}>Target</ThemedText>
      </View>

      <Svg width={size} height={size} style={styles.svg}>
        {/* Outer circle - target level */}
        <Circle
          cx={centerX}
          cy={centerY}
          r={maxRadius}
          stroke="#4A86E8"
          strokeWidth={3}
          fill="#E6F2FF"
          fillOpacity={0.3}
        />

        {/* Inner circle - current level background */}
        <Circle
          cx={centerX}
          cy={centerY}
          r={innerRadius}
          stroke="#7BA7F7"
          strokeWidth={2}
          fill="#F0F7FF"
          fillOpacity={0.5}
        />

        {/* Center circle */}
        <Circle
          cx={centerX}
          cy={centerY}
          r={centerRadius}
          fill="#4A86E8"
        />

        {/* Center text */}
        <SvgText
          x={centerX}
          y={centerY - 5}
          textAnchor="middle"
          fontSize="12"
          fontWeight="600"
          fill="#FFFFFF"
        >
          Language
        </SvgText>
        <SvgText
          x={centerX}
          y={centerY + 8}
          textAnchor="middle"
          fontSize="12"
          fontWeight="600"
          fill="#FFFFFF"
        >
          Chart
        </SvgText>

        {/* Radial lines from center to edge */}
        {skillPositions.map((pos, index) => (
          <Line
            key={`radial-${index}`}
            x1={centerX}
            y1={centerY}
            x2={centerX + Math.cos(pos.angle) * maxRadius}
            y2={centerY + Math.sin(pos.angle) * maxRadius}
            stroke="#333"
            strokeWidth={0.5}
            opacity={0.3}
          />
        ))}

        {/* Current skill level polygon */}
        <Polygon
          points={currentPolygonPoints}
          fill="#4A86E8"
          fillOpacity={0.2}
          stroke="#4A86E8"
          strokeWidth={2}
        />

        {/* Data points for current levels */}
        {skillPositions.map((pos, index) => (
          <Circle
            key={`point-${index}`}
            cx={pos.currentX}
            cy={pos.currentY}
            r={3}
            fill="#4A86E8"
          />
        ))}

        {/* Skill labels positioned around the circle */}
        {skillPositions.map((pos, index) => {
          // Adjust text anchor based on position
          let textAnchor: 'start' | 'middle' | 'end' = 'middle';
          if (pos.labelX < centerX - 20) textAnchor = 'end';
          else if (pos.labelX > centerX + 20) textAnchor = 'start';

          return (
            <G key={`label-${index}`}>
              <SvgText
                x={pos.labelX}
                y={pos.labelY - 5}
                textAnchor={textAnchor}
                fontSize="9"
                fontWeight="600"
                fill="#333"
              >
                {pos.skill.toUpperCase()}
              </SvgText>
              <SvgText
                x={pos.labelX}
                y={pos.labelY + 8}
                textAnchor={textAnchor}
                fontSize="8"
                fill="#666"
              >
                Practicing
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  targetLabel: {
    position: 'absolute',
    zIndex: 10,
    alignItems: 'center',
  },
  targetText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  svg: {
    marginTop: 20,
  },
}); 