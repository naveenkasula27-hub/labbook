/**
 * Real photos for the "Find a test" category chip row — AI-generated,
 * lab-sourced, or (for Markers/Stool/Scans) free-licensed stock photos
 * picked to match the same close-up clinical look. Only used on the chip
 * row's larger circles; the small icon next to each test in the list below
 * still uses the plain line icon from categoryIcons.jsx, since a photo
 * repeated 100+ times at 20px would be heavy and hard to read.
 */
import thyroid from "../assets/categories/thyroid.jpg";
import heart from "../assets/categories/heart.jpg";
import liver from "../assets/categories/liver.jpg";
import hormones from "../assets/categories/hormones.jpg";
import vitamins from "../assets/categories/vitamins.jpg";
import infection from "../assets/categories/infection.jpg";
import urine from "../assets/categories/urine.jpg";
import allergy from "../assets/categories/allergy.jpg";
import fever from "../assets/categories/fever.jpg";
import routine from "../assets/categories/routine.jpg";
import diabetes from "../assets/categories/diabetes.jpg";
import kidney from "../assets/categories/kidney.jpg";
import clotting from "../assets/categories/clotting.jpg";
import markers from "../assets/categories/markers.jpg";
import stool from "../assets/categories/stool.jpg";
import scans from "../assets/categories/scans.jpg";

const CATEGORY_PHOTOS = {
  Thyroid: thyroid,
  Heart: heart,
  Liver: liver,
  Hormones: hormones,
  Vitamins: vitamins,
  Infection: infection,
  Urine: urine,
  Allergy: allergy,
  Fever: fever,
  Routine: routine,
  Diabetes: diabetes,
  Kidney: kidney,
  Clotting: clotting,
  Markers: markers,
  Stool: stool,
  Scans: scans,
};

export default CATEGORY_PHOTOS;
