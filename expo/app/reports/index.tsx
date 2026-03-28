import { useState } from "react";
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Platform, Alert } from "react-native";
import { Stack } from "expo-router";
import { FileText, Download, Calendar, TrendingUp, BarChart3 } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useBeeMindStore } from "@/store/beemind-store";

type ReportType = "summary" | "inspections" | "harvests" | "tasks" | "queens";

export default function ReportsScreen() {
  const { yards, hives, queens, inspections, tasks, harvests, devices, sensorReadings } = useBeeMindStore();
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);

  const generateSummaryReport = () => {
    const activeHives = hives.filter((h) => h.status === "Active").length;
    const totalInspections = inspections.length;
    const avgMites = inspections.filter((i) => i.mites_per_100).length > 0
      ? inspections.reduce((sum, i) => sum + (i.mites_per_100 || 0), 0) / inspections.filter((i) => i.mites_per_100).length
      : 0;
    const totalHarvest = harvests.reduce((sum, h) => sum + h.weight_kg, 0);
    const pendingTasks = tasks.filter((t) => !t.is_done).length;
    const activeQueens = queens.filter((q) => q.status === "Active").length;

    return {
      title: "Summary Report",
      data: [
        { label: "Total Yards", value: yards.length.toString() },
        { label: "Total Hives", value: hives.length.toString() },
        { label: "Active Hives", value: activeHives.toString() },
        { label: "Active Queens", value: activeQueens.toString() },
        { label: "Total Inspections", value: totalInspections.toString() },
        { label: "Avg Mite Count", value: avgMites.toFixed(2) + "%" },
        { label: "Total Harvest", value: totalHarvest.toFixed(1) + " kg" },
        { label: "Pending Tasks", value: pendingTasks.toString() },
        { label: "Devices", value: devices.length.toString() },
        { label: "Sensor Readings", value: sensorReadings.length.toString() },
      ],
    };
  };

  const generateInspectionsReport = () => {
    const last30Days = inspections.filter((i) => {
      const date = new Date(i.performed_at);
      const now = new Date();
      const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= 30;
    });

    const solidBrood = last30Days.filter((i) => i.brood_pattern === "solid").length;
    const spottyBrood = last30Days.filter((i) => i.brood_pattern === "spotty").length;
    const highMites = last30Days.filter((i) => (i.mites_per_100 || 0) > 3).length;

    return {
      title: "Inspections Report (Last 30 Days)",
      data: [
        { label: "Total Inspections", value: last30Days.length.toString() },
        { label: "Solid Brood Pattern", value: solidBrood.toString() },
        { label: "Spotty Brood Pattern", value: spottyBrood.toString() },
        { label: "High Mite Count (>3%)", value: highMites.toString() },
        { label: "Eggs Seen", value: last30Days.filter((i) => i.eggs_seen).length.toString() },
        { label: "Larvae Seen", value: last30Days.filter((i) => i.larvae_seen).length.toString() },
      ],
    };
  };

  const generateHarvestsReport = () => {
    const currentYear = new Date().getFullYear();
    const yearHarvests = harvests.filter((h) => {
      const date = new Date(h.created_at);
      return date.getFullYear() === currentYear;
    });

    const totalWeight = yearHarvests.reduce((sum, h) => sum + h.weight_kg, 0);
    const totalFrames = yearHarvests.reduce((sum, h) => sum + h.frames_spun, 0);
    const avgMoisture = yearHarvests.filter((h) => h.moisture_pct).length > 0
      ? yearHarvests.reduce((sum, h) => sum + (h.moisture_pct || 0), 0) / yearHarvests.filter((h) => h.moisture_pct).length
      : 0;

    return {
      title: `Harvest Report (${currentYear})`,
      data: [
        { label: "Total Batches", value: yearHarvests.length.toString() },
        { label: "Total Weight", value: totalWeight.toFixed(1) + " kg" },
        { label: "Total Frames", value: totalFrames.toString() },
        { label: "Avg Moisture", value: avgMoisture.toFixed(1) + "%" },
        { label: "Avg per Batch", value: (totalWeight / (yearHarvests.length || 1)).toFixed(1) + " kg" },
      ],
    };
  };

  const generateTasksReport = () => {
    const completedTasks = tasks.filter((t) => t.is_done).length;
    const pendingTasks = tasks.filter((t) => !t.is_done).length;
    const overdueTasks = tasks.filter((t) => {
      if (!t.due_at || t.is_done) return false;
      return new Date(t.due_at) < new Date();
    }).length;

    const highPriority = tasks.filter((t) => !t.is_done && t.priority === 1).length;
    const mediumPriority = tasks.filter((t) => !t.is_done && t.priority === 2).length;
    const lowPriority = tasks.filter((t) => !t.is_done && t.priority === 3).length;

    return {
      title: "Tasks Report",
      data: [
        { label: "Total Tasks", value: tasks.length.toString() },
        { label: "Completed", value: completedTasks.toString() },
        { label: "Pending", value: pendingTasks.toString() },
        { label: "Overdue", value: overdueTasks.toString() },
        { label: "High Priority", value: highPriority.toString() },
        { label: "Medium Priority", value: mediumPriority.toString() },
        { label: "Low Priority", value: lowPriority.toString() },
      ],
    };
  };

  const generateQueensReport = () => {
    const activeQueens = queens.filter((q) => q.status === "Active").length;
    const superseded = queens.filter((q) => q.status === "Superseded").length;
    const lost = queens.filter((q) => q.status === "Lost").length;
    const dead = queens.filter((q) => q.status === "Dead").length;

    const avgTemperament = queens.filter((q) => q.temperament && q.status === "Active").length > 0
      ? queens.filter((q) => q.status === "Active").reduce((sum, q) => sum + (q.temperament || 0), 0) /
        queens.filter((q) => q.temperament && q.status === "Active").length
      : 0;

    return {
      title: "Queens Report",
      data: [
        { label: "Total Queens", value: queens.length.toString() },
        { label: "Active", value: activeQueens.toString() },
        { label: "Superseded", value: superseded.toString() },
        { label: "Lost", value: lost.toString() },
        { label: "Dead", value: dead.toString() },
        { label: "Avg Temperament", value: avgTemperament.toFixed(1) + "/5" },
      ],
    };
  };

  const getReportData = (type: ReportType) => {
    switch (type) {
      case "summary":
        return generateSummaryReport();
      case "inspections":
        return generateInspectionsReport();
      case "harvests":
        return generateHarvestsReport();
      case "tasks":
        return generateTasksReport();
      case "queens":
        return generateQueensReport();
      default:
        return { title: "", data: [] };
    }
  };

  const handleExport = (type: ReportType) => {
    const report = getReportData(type);
    const exportData = {
      report: report.title,
      generatedAt: new Date().toISOString(),
      data: report.data,
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    Alert.alert(
      "Export Report",
      `Report ready to export.\\n\\nSize: ${(jsonString.length / 1024).toFixed(2)} KB`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Copy Data",
          onPress: () => {
            console.log("Export data:", jsonString);
            Alert.alert("Success", "Report data logged to console. In production, this would copy to clipboard.");
          },
        },
      ]
    );
  };

  const reportTypes: Array<{ type: ReportType; title: string; icon: any; color: string }> = [
    { type: "summary", title: "Summary Report", icon: FileText, color: Colors.light.primary },
    { type: "inspections", title: "Inspections", icon: Calendar, color: Colors.light.success },
    { type: "harvests", title: "Harvests", icon: TrendingUp, color: Colors.light.warning },
    { type: "tasks", title: "Tasks", icon: BarChart3, color: Colors.light.error },
    { type: "queens", title: "Queens", icon: FileText, color: Colors.light.primary },
  ];

  return (
    <>
      <Stack.Screen options={{ title: "Reports" }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Generate Reports</Text>
        <Text style={styles.pageSubtitle}>
          Select a report type to view statistics and export data
        </Text>

        <View style={styles.reportGrid}>
          {reportTypes.map((report) => {
            const Icon = report.icon;
            return (
              <TouchableOpacity
                key={report.type}
                style={[
                  styles.reportCard,
                  selectedReport === report.type && styles.reportCardActive,
                ]}
                onPress={() => setSelectedReport(report.type)}
              >
                <View style={[styles.reportIcon, { backgroundColor: report.color + "20" }]}>
                  <Icon size={24} color={report.color} />
                </View>
                <Text style={styles.reportTitle}>{report.title}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedReport && (
          <View style={styles.reportView}>
            <View style={styles.reportHeader}>
              <Text style={styles.reportViewTitle}>{getReportData(selectedReport).title}</Text>
              <TouchableOpacity
                style={styles.exportButton}
                onPress={() => handleExport(selectedReport)}
              >
                <Download size={20} color="#FFFFFF" />
                <Text style={styles.exportButtonText}>Export</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.reportData}>
              {getReportData(selectedReport).data.map((item, index) => (
                <View key={index} style={styles.dataRow}>
                  <Text style={styles.dataLabel}>{item.label}</Text>
                  <Text style={styles.dataValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
    marginBottom: 24,
  },
  reportGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  reportCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.light.card,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  reportCardActive: {
    borderColor: Colors.light.primary,
  },
  reportIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.light.text,
    textAlign: "center",
  },
  reportView: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  reportViewTitle: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: Colors.light.text,
    flex: 1,
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  exportButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600" as const,
  },
  reportData: {
    gap: 12,
  },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  dataLabel: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
    flex: 1,
  },
  dataValue: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
});
