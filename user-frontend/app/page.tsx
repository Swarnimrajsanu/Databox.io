"use client"
import Appbar from "@/components/Appbar";
import { Hero } from "@/components/Hero";
 
import { Upload } from "@/components/upload";

export default function Home() {
  return (
    <main>
      <Appbar />
      <Hero />
      <Upload />
    </main>
  );
}
