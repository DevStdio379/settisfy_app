// src/components/CategoryDropdown.tsx
import React from "react";
import { StyleSheet, View } from "react-native";
import { Dropdown } from "react-native-element-dropdown";

interface CategoryDropdownProps {
  options: { label: string; value: string }[];
  selectedOption: string;
  setSelectedOption: (value: string) => void;
  placeholder?: string;
}

export const CategoryDropdown: React.FC<CategoryDropdownProps> = ({
  options,
  selectedOption,
  setSelectedOption,
  placeholder
}) => {
  return (
    <View style={styles.container}>
      <Dropdown
        data={options}
        labelField="label"
        valueField="value"
        placeholder= {placeholder ? placeholder : "Select an option"}
        value={selectedOption}
        onChange={(item) => setSelectedOption(item.value)}
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
