import React from "react";
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 11, fontFamily: "Helvetica", color: "#1a1a1a", lineHeight: 1.5 },
  header: { marginBottom: 24 },
  name: { fontSize: 15, fontFamily: "Helvetica-Bold" },
  contact: { fontSize: 9.5, color: "#5a6e67", marginTop: 3 },
  paragraph: { marginBottom: 12 },
});

type Props = { fullName: string; email: string; phone: string; body: string };

function LetterDocument({ fullName, email, phone, body }: Props) {
  const paragraphs = body.split(/\n\s*\n/).filter(p => p.trim());
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.contact}>{email} · {phone}</Text>
        </View>
        {paragraphs.map((p, i) => (
          <Text key={i} style={styles.paragraph}>{p.trim()}</Text>
        ))}
      </Page>
    </Document>
  );
}

export async function renderLetterPdf(props: Props): Promise<Buffer> {
  return renderToBuffer(<LetterDocument {...props} />);
}
