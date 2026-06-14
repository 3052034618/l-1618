import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { MonthlyReport, VolunteerStats, ActivityStats } from "@/types";
import { formatDate, activityTypeMap } from "@/utils/formatters";

export async function exportMonthlyReport(report: MonthlyReport): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("志愿服务月度运营报告", pageWidth / 2, yPos, { align: "center" });
  yPos += 10;

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`报告月份: ${report.month}`, pageWidth / 2, yPos, { align: "center" });
  yPos += 8;
  doc.text(`生成时间: ${formatDate(new Date(), "YYYY-MM-DD HH:mm")}`, pageWidth / 2, yPos, { align: "center" });
  yPos += 15;

  doc.setLineWidth(0.5);
  doc.line(15, yPos, pageWidth - 15, yPos);
  yPos += 10;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("一、核心指标概览", 15, yPos);
  yPos += 8;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  const metrics = [
    ["活动总数", `${report.totalActivities} 场`],
    ["参与志愿者", `${report.totalVolunteers} 人`],
    ["总服务工时", `${report.totalHours} 小时`],
    ["人均服务工时", `${report.avgHoursPerVolunteer} 小时`],
    ["平均参与率", `${(report.participationRate * 100).toFixed(1)}%`],
  ];

  metrics.forEach(([label, value]) => {
    doc.text(`${label}:`, 20, yPos);
    doc.setFont("helvetica", "bold");
    doc.text(value, 70, yPos);
    doc.setFont("helvetica", "normal");
    yPos += 7;
  });

  yPos += 10;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("二、按活动类型统计", 15, yPos);
  yPos += 8;

  doc.setFontSize(10);
  const tableHeader = ["活动类型", "活动数量", "总工时(小时)"];
  const colWidths = [60, 40, 50];
  let colX = 20;

  doc.setFont("helvetica", "bold");
  tableHeader.forEach((header, i) => {
    doc.text(header, colX, yPos);
    colX += colWidths[i];
  });
  yPos += 6;

  doc.setLineWidth(0.3);
  doc.line(18, yPos - 2, pageWidth - 18, yPos - 2);

  doc.setFont("helvetica", "normal");
  report.byType.forEach((stat: ActivityStats) => {
    colX = 20;
    doc.text(activityTypeMap[stat.activityType as keyof typeof activityTypeMap] || stat.activityType, colX, yPos);
    colX += colWidths[0];
    doc.text(`${stat.count} 场`, colX, yPos);
    colX += colWidths[1];
    doc.text(`${stat.totalHours}`, colX, yPos);
    yPos += 6;
  });

  yPos += 10;

  if (yPos > 240) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("三、优秀志愿者排行榜", 15, yPos);
  yPos += 8;

  doc.setFontSize(10);
  const volHeader = ["排名", "姓名", "参与次数", "总工时", "参与率"];
  const volWidths = [15, 45, 25, 30, 30];
  colX = 20;

  doc.setFont("helvetica", "bold");
  volHeader.forEach((header, i) => {
    doc.text(header, colX, yPos);
    colX += volWidths[i];
  });
  yPos += 6;

  doc.setLineWidth(0.3);
  doc.line(18, yPos - 2, pageWidth - 18, yPos - 2);

  doc.setFont("helvetica", "normal");
  report.topVolunteers.forEach((vol: VolunteerStats, index: number) => {
    colX = 20;
    doc.text(`${index + 1}`, colX, yPos);
    colX += volWidths[0];
    doc.text(vol.volunteerName, colX, yPos);
    colX += volWidths[1];
    doc.text(`${vol.activityCount}次`, colX, yPos);
    colX += volWidths[2];
    doc.text(`${vol.totalHours}h`, colX, yPos);
    colX += volWidths[3];
    doc.text(`${(vol.participationRate * 100).toFixed(0)}%`, colX, yPos);
    yPos += 6;
  });

  yPos += 15;
  doc.setFontSize(9);
  doc.setTextColor(128, 128, 128);
  doc.text(
    "本报告由志愿者管理系统自动生成",
    pageWidth / 2,
    280,
    { align: "center" }
  );

  doc.save(`志愿服务月度报告_${report.month}.pdf`);
}

export async function exportCertificateAsPDF(
  elementId: string,
  filename: string = "志愿服务证书.pdf"
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) return;

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
  const imgX = (pdfWidth - imgWidth * ratio) / 2;
  const imgY = (pdfHeight - imgHeight * ratio) / 2;

  pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio);
  pdf.save(filename);
}
