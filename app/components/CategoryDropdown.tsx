// src/components/CategoryDropdown.tsx
import React from "react";
import { StyleSheet, View } from "react-native";
import { Dropdown } from "react-native-element-dropdown";

interface CategoryDropdownProps {
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
}

const categories = [
  { label: "Plumbing", value: "plumbing" },
  { label: "Electrical", value: "electrical" },
  { label: "Cleaning", value: "cleaning" },
  { label: "Delivery", value: "delivery" },
  { label: "Others", value: "others" },
];

export const CategoryDropdown: React.FC<CategoryDropdownProps> = ({
  selectedCategory,
  setSelectedCategory,
}) => {
  return (
    <View style={styles.container}>
      <Dropdown
        data={categories}
        labelField="label"
        valueField="value"
        placeholder="Select a category"
        value={selectedCategory}
        onChange={(item) => setSelectedCategory(item.value)}
        style={styles.dropdown}
        placeholderStyle={styles.placeholder}
        selectedTextStyle={styles.selectedText}
        itemTextStyle={styles.itemText}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  dropdown: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  placeholder: {
    color: "#999",
    fontSize: 16,
  },
  selectedText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "500",
  },
  itemText: {
    color: "#333",
    fontSize: 16,
  },
});
