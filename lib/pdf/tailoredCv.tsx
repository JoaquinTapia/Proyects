import React from "react";
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 0, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a1a" },
  header: { backgroundColor: "#3e4e4a", padding: "24pt 32pt" },
  name: { color: "#ffffff", fontSize: 22, fontFamily: "Helvetica-Bold" },
  headline: { color: "#d8e0dc", fontSize: 11, marginTop: 4, letterSpacing: 1.5 },
  summary: { color: "#f0f3f1", fontSize: 9.5, marginTop: 10, lineHeight: 1.45 },

  body: { padding: "20pt 32pt" },

  sectionTitle: {
    fontSize: 11, fontFamily: "Helvetica-Bold", color: "#3e4e4a",
    marginTop: 16, marginBottom: 8, borderBottom: "1pt solid #3e4e4a", paddingBottom: 3,
  },

  jobRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10, marginBottom: 2 },
  jobTitle: { fontFamily: "Helvetica-Bold", fontSize: 10.5, color: "#1a1a1a" },
  jobMeta: { fontSize: 9, color: "#5a6e67" },

  bulletRow: { flexDirection: "row", marginBottom: 3, marginTop: 2 },
  bulletDot: { width: 10, color: "#3e4e4a" },
  bulletText: { flex: 1, lineHeight: 1.4, fontSize: 9.3 },

  eduRow: { marginBottom: 6 },
  eduDegree: { fontFamily: "Helvetica-Bold", fontSize: 10 },
  eduMeta: { fontSize: 9, color: "#5a6e67" },

  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  chip: {
    fontSize: 8.5, backgroundColor: "#eef1ef", color: "#3e4e4a",
    paddingVertical: 3, paddingHorizontal: 7, borderRadius: 3, marginRight: 5, marginBottom: 5,
  },

  footer: {
    marginTop: 18, paddingTop: 10, borderTop: "0.5pt solid #cccccc",
    fontSize: 8.5, color: "#5a6e67", textAlign: "center",
  },
});

type ExperienceItem = { title: string; company: string; dates: string; bullets: string[] };
type EducationItem = { degree: string; institution: string; dates: string };

type Props = {
  fullName: string;
  headline: string;
  phone: string;
  location: string;
  email: string;
  summary: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: string[];
  languages: string[];
};

function TailoredCvDocument({
  fullName, headline, phone, location, email, summary, experience, education, skills, languages,
}: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header}>
          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.headline}>{headline?.toUpperCase()}</Text>
          <Text style={styles.summary}>{summary}</Text>
        </View>

        <View style={styles.body}>
          {experience.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>EXPERIENCIA LABORAL</Text>
              {experience.map((job, i) => (
                <View key={i} wrap={false} style={{ marginBottom: 8 }}>
                  <View style={styles.jobRow}>
                    <Text style={styles.jobTitle}>{job.title} — {job.company}</Text>
                    <Text style={styles.jobMeta}>{job.dates}</Text>
                  </View>
                  {job.bullets.map((b, j) => (
                    <View style={styles.bulletRow} key={j}>
                      <Text style={styles.bulletDot}>•</Text>
                      <Text style={styles.bulletText}>{b}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </>
          )}

          {education.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>EDUCACIÓN</Text>
              {education.map((edu, i) => (
                <View key={i} style={styles.eduRow}>
                  <Text style={styles.eduDegree}>{edu.degree}</Text>
                  <Text style={styles.eduMeta}>{edu.institution} · {edu.dates}</Text>
                </View>
              ))}
            </>
          )}

          {skills.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>HABILIDADES TÉCNICAS</Text>
              <View style={styles.chipsWrap}>
                {skills.map((s, i) => <Text key={i} style={styles.chip}>{s}</Text>)}
              </View>
            </>
          )}

          {languages.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>IDIOMAS</Text>
              <Text style={{ fontSize: 9.5 }}>{languages.join("  ·  ")}</Text>
            </>
          )}

          <View style={styles.footer}>
            <Text>{email} · {phone} · {location}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export async function renderTailoredCvPdf(props: Props): Promise<Buffer> {
  return renderToBuffer(<TailoredCvDocument {...props} />);
}
