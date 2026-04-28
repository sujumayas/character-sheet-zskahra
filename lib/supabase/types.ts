export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      birthplace_adolescent_rank_rules: {
        Row: {
          birthplace_id: string
          category_id: string | null
          created_at: string | null
          id: string
          language_id: string | null
          notes: string | null
          ranks_granted: number
          skill_id: string | null
          target_type: string
          trait_id: string | null
        }
        Insert: {
          birthplace_id: string
          category_id?: string | null
          created_at?: string | null
          id?: string
          language_id?: string | null
          notes?: string | null
          ranks_granted: number
          skill_id?: string | null
          target_type: string
          trait_id?: string | null
        }
        Update: {
          birthplace_id?: string
          category_id?: string | null
          created_at?: string | null
          id?: string
          language_id?: string | null
          notes?: string | null
          ranks_granted?: number
          skill_id?: string | null
          target_type?: string
          trait_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "birthplace_adolescent_rank_rules_birthplace_id_fkey"
            columns: ["birthplace_id"]
            isOneToOne: false
            referencedRelation: "birthplaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "birthplace_adolescent_rank_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "birthplace_adolescent_rank_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "character_categories_total"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "birthplace_adolescent_rank_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "view_character_skills"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "birthplace_adolescent_rank_rules_language_id_fkey"
            columns: ["language_id"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "birthplace_adolescent_rank_rules_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "birthplace_adolescent_rank_rules_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "view_character_skills"
            referencedColumns: ["skill_id"]
          },
          {
            foreignKeyName: "birthplace_adolescent_rank_rules_trait_id_fkey"
            columns: ["trait_id"]
            isOneToOne: false
            referencedRelation: "character_traits_total"
            referencedColumns: ["trait_id"]
          },
          {
            foreignKeyName: "birthplace_adolescent_rank_rules_trait_id_fkey"
            columns: ["trait_id"]
            isOneToOne: false
            referencedRelation: "traits"
            referencedColumns: ["id"]
          },
        ]
      }
      birthplace_category_modifiers: {
        Row: {
          birthplace_id: string
          category_id: string
          created_at: string | null
          id: string
          modifier_value: number
          notes: string | null
        }
        Insert: {
          birthplace_id: string
          category_id: string
          created_at?: string | null
          id?: string
          modifier_value: number
          notes?: string | null
        }
        Update: {
          birthplace_id?: string
          category_id?: string
          created_at?: string | null
          id?: string
          modifier_value?: number
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "birthplace_category_modifiers_birthplace_id_fkey"
            columns: ["birthplace_id"]
            isOneToOne: false
            referencedRelation: "birthplaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "birthplace_category_modifiers_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "birthplace_category_modifiers_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "character_categories_total"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "birthplace_category_modifiers_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "view_character_skills"
            referencedColumns: ["category_id"]
          },
        ]
      }
      birthplace_language_bonuses: {
        Row: {
          base_spoken_ranks: number | null
          base_written_ranks: number | null
          birthplace_id: string
          created_at: string | null
          id: string
          language_id: string
          notes: string | null
        }
        Insert: {
          base_spoken_ranks?: number | null
          base_written_ranks?: number | null
          birthplace_id: string
          created_at?: string | null
          id?: string
          language_id: string
          notes?: string | null
        }
        Update: {
          base_spoken_ranks?: number | null
          base_written_ranks?: number | null
          birthplace_id?: string
          created_at?: string | null
          id?: string
          language_id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "birthplace_language_bonuses_birthplace_id_fkey"
            columns: ["birthplace_id"]
            isOneToOne: false
            referencedRelation: "birthplaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "birthplace_language_bonuses_language_id_fkey"
            columns: ["language_id"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["id"]
          },
        ]
      }
      birthplace_stat_modifiers: {
        Row: {
          birthplace_id: string
          created_at: string | null
          id: string
          modifier_value: number
          notes: string | null
          stat_id: string
        }
        Insert: {
          birthplace_id: string
          created_at?: string | null
          id?: string
          modifier_value: number
          notes?: string | null
          stat_id: string
        }
        Update: {
          birthplace_id?: string
          created_at?: string | null
          id?: string
          modifier_value?: number
          notes?: string | null
          stat_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "birthplace_stat_modifiers_birthplace_id_fkey"
            columns: ["birthplace_id"]
            isOneToOne: false
            referencedRelation: "birthplaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "birthplace_stat_modifiers_stat_id_fkey"
            columns: ["stat_id"]
            isOneToOne: false
            referencedRelation: "character_stats_total"
            referencedColumns: ["stat_id"]
          },
          {
            foreignKeyName: "birthplace_stat_modifiers_stat_id_fkey"
            columns: ["stat_id"]
            isOneToOne: false
            referencedRelation: "stats"
            referencedColumns: ["id"]
          },
        ]
      }
      birthplace_trait_modifiers: {
        Row: {
          birthplace_id: string
          created_at: string | null
          id: string
          modifier_value: number
          notes: string | null
          trait_id: string
        }
        Insert: {
          birthplace_id: string
          created_at?: string | null
          id?: string
          modifier_value: number
          notes?: string | null
          trait_id: string
        }
        Update: {
          birthplace_id?: string
          created_at?: string | null
          id?: string
          modifier_value?: number
          notes?: string | null
          trait_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "birthplace_trait_modifiers_birthplace_id_fkey"
            columns: ["birthplace_id"]
            isOneToOne: false
            referencedRelation: "birthplaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "birthplace_trait_modifiers_trait_id_fkey"
            columns: ["trait_id"]
            isOneToOne: false
            referencedRelation: "character_traits_total"
            referencedColumns: ["trait_id"]
          },
          {
            foreignKeyName: "birthplace_trait_modifiers_trait_id_fkey"
            columns: ["trait_id"]
            isOneToOne: false
            referencedRelation: "traits"
            referencedColumns: ["id"]
          },
        ]
      }
      birthplaces: {
        Row: {
          category: string | null
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          category_group: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          stat_id: string | null
        }
        Insert: {
          category_group?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          stat_id?: string | null
        }
        Update: {
          category_group?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          stat_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_stat_id_fkey"
            columns: ["stat_id"]
            isOneToOne: false
            referencedRelation: "character_stats_total"
            referencedColumns: ["stat_id"]
          },
          {
            foreignKeyName: "categories_stat_id_fkey"
            columns: ["stat_id"]
            isOneToOne: false
            referencedRelation: "stats"
            referencedColumns: ["id"]
          },
        ]
      }
      character_activity_modifiers: {
        Row: {
          applies_to: string | null
          category_id: string | null
          character_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          modifier_value: number
          notes: string | null
          skill_id: string | null
          source_name: string | null
          source_type: string
        }
        Insert: {
          applies_to?: string | null
          category_id?: string | null
          character_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          modifier_value: number
          notes?: string | null
          skill_id?: string | null
          source_name?: string | null
          source_type: string
        }
        Update: {
          applies_to?: string | null
          category_id?: string | null
          character_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          modifier_value?: number
          notes?: string | null
          skill_id?: string | null
          source_name?: string | null
          source_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_activity_modifiers_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_activity_modifiers_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "character_categories_total"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "character_activity_modifiers_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "view_character_skills"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "character_activity_modifiers_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "character_traits_total"
            referencedColumns: ["character_id"]
          },
          {
            foreignKeyName: "character_activity_modifiers_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_activity_modifiers_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_activity_modifiers_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "view_character_skills"
            referencedColumns: ["skill_id"]
          },
        ]
      }
      character_adolescent_ranks: {
        Row: {
          category_id: string | null
          character_id: string
          created_at: string | null
          id: string
          language_id: string | null
          notes: string | null
          ranks_granted: number
          skill_id: string | null
          source: string | null
          specialization_name: string | null
          target_type: string
          trait_id: string | null
          weapon_id: string | null
          weapon_type_id: string | null
        }
        Insert: {
          category_id?: string | null
          character_id: string
          created_at?: string | null
          id?: string
          language_id?: string | null
          notes?: string | null
          ranks_granted?: number
          skill_id?: string | null
          source?: string | null
          specialization_name?: string | null
          target_type: string
          trait_id?: string | null
          weapon_id?: string | null
          weapon_type_id?: string | null
        }
        Update: {
          category_id?: string | null
          character_id?: string
          created_at?: string | null
          id?: string
          language_id?: string | null
          notes?: string | null
          ranks_granted?: number
          skill_id?: string | null
          source?: string | null
          specialization_name?: string | null
          target_type?: string
          trait_id?: string | null
          weapon_id?: string | null
          weapon_type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_adolescent_ranks_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_adolescent_ranks_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "character_categories_total"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "character_adolescent_ranks_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "view_character_skills"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "character_adolescent_ranks_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "character_traits_total"
            referencedColumns: ["character_id"]
          },
          {
            foreignKeyName: "character_adolescent_ranks_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_adolescent_ranks_language_id_fkey"
            columns: ["language_id"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_adolescent_ranks_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_adolescent_ranks_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "view_character_skills"
            referencedColumns: ["skill_id"]
          },
          {
            foreignKeyName: "character_adolescent_ranks_trait_id_fkey"
            columns: ["trait_id"]
            isOneToOne: false
            referencedRelation: "character_traits_total"
            referencedColumns: ["trait_id"]
          },
          {
            foreignKeyName: "character_adolescent_ranks_trait_id_fkey"
            columns: ["trait_id"]
            isOneToOne: false
            referencedRelation: "traits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_adolescent_ranks_weapon_id_fkey"
            columns: ["weapon_id"]
            isOneToOne: false
            referencedRelation: "weapons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_adolescent_ranks_weapon_type_id_fkey"
            columns: ["weapon_type_id"]
            isOneToOne: false
            referencedRelation: "weapon_types"
            referencedColumns: ["id"]
          },
        ]
      }
      character_categories: {
        Row: {
          activity_modifier: number | null
          category_id: string
          character_id: string
          created_at: string | null
          dp_allocated: number | null
          gm_bonus: number | null
          id: string
          notes: string | null
          special_modifier: number | null
          special_notes: string | null
          talent_bonus: number | null
          updated_at: string | null
        }
        Insert: {
          activity_modifier?: number | null
          category_id: string
          character_id: string
          created_at?: string | null
          dp_allocated?: number | null
          gm_bonus?: number | null
          id?: string
          notes?: string | null
          special_modifier?: number | null
          special_notes?: string | null
          talent_bonus?: number | null
          updated_at?: string | null
        }
        Update: {
          activity_modifier?: number | null
          category_id?: string
          character_id?: string
          created_at?: string | null
          dp_allocated?: number | null
          gm_bonus?: number | null
          id?: string
          notes?: string | null
          special_modifier?: number | null
          special_notes?: string | null
          talent_bonus?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "character_categories_total"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "character_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "view_character_skills"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "character_categories_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "character_traits_total"
            referencedColumns: ["character_id"]
          },
          {
            foreignKeyName: "character_categories_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_chaos: {
        Row: {
          chaos_dice: number | null
          chaos_index: number | null
          chaos_power_calculator: number | null
          chaos_track: number | null
          character_id: string
          created_at: string | null
          id: string
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          chaos_dice?: number | null
          chaos_index?: number | null
          chaos_power_calculator?: number | null
          chaos_track?: number | null
          character_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          chaos_dice?: number | null
          chaos_index?: number | null
          chaos_power_calculator?: number | null
          chaos_track?: number | null
          character_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_chaos_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: true
            referencedRelation: "character_traits_total"
            referencedColumns: ["character_id"]
          },
          {
            foreignKeyName: "character_chaos_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: true
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_description: {
        Row: {
          age: number | null
          appearance: number | null
          appearance_notes: string | null
          appearance_roll: number | null
          birthplace_id: string | null
          character_id: string
          created_at: string | null
          description_notes: string | null
          fate_points: number | null
          height_cm: number | null
          id: string
          profession_id: string | null
          race_id: string | null
          sex_id: string | null
          updated_at: string | null
          weight_kg: number | null
        }
        Insert: {
          age?: number | null
          appearance?: number | null
          appearance_notes?: string | null
          appearance_roll?: number | null
          birthplace_id?: string | null
          character_id: string
          created_at?: string | null
          description_notes?: string | null
          fate_points?: number | null
          height_cm?: number | null
          id?: string
          profession_id?: string | null
          race_id?: string | null
          sex_id?: string | null
          updated_at?: string | null
          weight_kg?: number | null
        }
        Update: {
          age?: number | null
          appearance?: number | null
          appearance_notes?: string | null
          appearance_roll?: number | null
          birthplace_id?: string | null
          character_id?: string
          created_at?: string | null
          description_notes?: string | null
          fate_points?: number | null
          height_cm?: number | null
          id?: string
          profession_id?: string | null
          race_id?: string | null
          sex_id?: string | null
          updated_at?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "character_description_birthplace_id_fkey"
            columns: ["birthplace_id"]
            isOneToOne: false
            referencedRelation: "birthplaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_description_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: true
            referencedRelation: "character_traits_total"
            referencedColumns: ["character_id"]
          },
          {
            foreignKeyName: "character_description_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: true
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_description_profession_id_fkey"
            columns: ["profession_id"]
            isOneToOne: false
            referencedRelation: "professions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_description_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_description_sex_id_fkey"
            columns: ["sex_id"]
            isOneToOne: false
            referencedRelation: "race_sexes"
            referencedColumns: ["id"]
          },
        ]
      }
      character_dp_sessions: {
        Row: {
          character_id: string | null
          dp_gained: number
          game_master_id: string | null
          id: string
          notes: string | null
          session_date: string | null
        }
        Insert: {
          character_id?: string | null
          dp_gained: number
          game_master_id?: string | null
          id?: string
          notes?: string | null
          session_date?: string | null
        }
        Update: {
          character_id?: string | null
          dp_gained?: number
          game_master_id?: string | null
          id?: string
          notes?: string | null
          session_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_dp_sessions_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "character_traits_total"
            referencedColumns: ["character_id"]
          },
          {
            foreignKeyName: "character_dp_sessions_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_dp_sessions_game_master_id_fkey"
            columns: ["game_master_id"]
            isOneToOne: false
            referencedRelation: "dungeon_masters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_game_modifiers: {
        Row: {
          character_id: string
          created_at: string
          id: string
          is_active: boolean
          modifier_value: number
          notes: string | null
          source_id: string | null
          source_type: string
          target_id: string | null
          target_type: string
          target_type_id: number | null
          updated_at: string
        }
        Insert: {
          character_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          modifier_value?: number
          notes?: string | null
          source_id?: string | null
          source_type: string
          target_id?: string | null
          target_type: string
          target_type_id?: number | null
          updated_at?: string
        }
        Update: {
          character_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          modifier_value?: number
          notes?: string | null
          source_id?: string | null
          source_type?: string
          target_id?: string | null
          target_type?: string
          target_type_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_game_modifiers_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "character_traits_total"
            referencedColumns: ["character_id"]
          },
          {
            foreignKeyName: "character_game_modifiers_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_game_modifiers_target_type_fkey"
            columns: ["target_type_id"]
            isOneToOne: false
            referencedRelation: "game_entity_types"
            referencedColumns: ["id"]
          },
        ]
      }
      character_game_values: {
        Row: {
          base_value: number
          character_id: string
          created_at: string
          equipment_bonus: number
          game_value_id: string
          gm_bonus: number
          id: string
          is_active: boolean
          notes: string | null
          special_modifier: number
          talent_bonus: number
          temp_modifier: number
          total_value: number | null
          updated_at: string
        }
        Insert: {
          base_value?: number
          character_id: string
          created_at?: string
          equipment_bonus?: number
          game_value_id: string
          gm_bonus?: number
          id?: string
          is_active?: boolean
          notes?: string | null
          special_modifier?: number
          talent_bonus?: number
          temp_modifier?: number
          total_value?: number | null
          updated_at?: string
        }
        Update: {
          base_value?: number
          character_id?: string
          created_at?: string
          equipment_bonus?: number
          game_value_id?: string
          gm_bonus?: number
          id?: string
          is_active?: boolean
          notes?: string | null
          special_modifier?: number
          talent_bonus?: number
          temp_modifier?: number
          total_value?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_game_values_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "character_traits_total"
            referencedColumns: ["character_id"]
          },
          {
            foreignKeyName: "character_game_values_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_game_values_game_value_id_fkey"
            columns: ["game_value_id"]
            isOneToOne: false
            referencedRelation: "game_values"
            referencedColumns: ["id"]
          },
        ]
      }
      character_languages: {
        Row: {
          character_id: string
          created_at: string | null
          id: string
          language_id: string
          notes: string | null
          source: string | null
          spoken_ranks: number | null
          updated_at: string | null
          written_ranks: number | null
        }
        Insert: {
          character_id: string
          created_at?: string | null
          id?: string
          language_id: string
          notes?: string | null
          source?: string | null
          spoken_ranks?: number | null
          updated_at?: string | null
          written_ranks?: number | null
        }
        Update: {
          character_id?: string
          created_at?: string | null
          id?: string
          language_id?: string
          notes?: string | null
          source?: string | null
          spoken_ranks?: number | null
          updated_at?: string | null
          written_ranks?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "character_languages_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "character_traits_total"
            referencedColumns: ["character_id"]
          },
          {
            foreignKeyName: "character_languages_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_languages_language_id_fkey"
            columns: ["language_id"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["id"]
          },
        ]
      }
      character_life_points: {
        Row: {
          character_id: string
          current_life_points: number
          dm_activity_modifier: number | null
          has_activity_penalty_reduction: boolean | null
          id: string
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          character_id: string
          current_life_points?: number
          dm_activity_modifier?: number | null
          has_activity_penalty_reduction?: boolean | null
          id?: string
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          character_id?: string
          current_life_points?: number
          dm_activity_modifier?: number | null
          has_activity_penalty_reduction?: boolean | null
          id?: string
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_life_points_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: true
            referencedRelation: "character_traits_total"
            referencedColumns: ["character_id"]
          },
          {
            foreignKeyName: "character_life_points_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: true
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_skill_access: {
        Row: {
          approval_notes: string | null
          approval_status: string | null
          approved_at: string | null
          approved_by_dm_id: string | null
          character_id: string
          created_at: string | null
          id: string
          skill_id: string
          specialization_name: string | null
        }
        Insert: {
          approval_notes?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by_dm_id?: string | null
          character_id: string
          created_at?: string | null
          id?: string
          skill_id: string
          specialization_name?: string | null
        }
        Update: {
          approval_notes?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by_dm_id?: string | null
          character_id?: string
          created_at?: string | null
          id?: string
          skill_id?: string
          specialization_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_skill_access_approved_by_dm_id_fkey"
            columns: ["approved_by_dm_id"]
            isOneToOne: false
            referencedRelation: "dungeon_masters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_skill_access_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "character_traits_total"
            referencedColumns: ["character_id"]
          },
          {
            foreignKeyName: "character_skill_access_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_skill_access_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_skill_access_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "view_character_skills"
            referencedColumns: ["skill_id"]
          },
        ]
      }
      character_skills: {
        Row: {
          activity_modifier: number | null
          character_id: string | null
          cost: number | null
          created_at: string | null
          dp_allocated: number | null
          dp_spent: number | null
          id: string
          is_active: boolean | null
          manual_modifier: number | null
          notes: string | null
          professional_bonus: number | null
          rank_bonus: number | null
          ranks: number | null
          skill_id: string | null
          special_bonus: number | null
          talent_bonus: number | null
          temp_modifier: number | null
          updated_at: string | null
        }
        Insert: {
          activity_modifier?: number | null
          character_id?: string | null
          cost?: number | null
          created_at?: string | null
          dp_allocated?: number | null
          dp_spent?: number | null
          id?: string
          is_active?: boolean | null
          manual_modifier?: number | null
          notes?: string | null
          professional_bonus?: number | null
          rank_bonus?: number | null
          ranks?: number | null
          skill_id?: string | null
          special_bonus?: number | null
          talent_bonus?: number | null
          temp_modifier?: number | null
          updated_at?: string | null
        }
        Update: {
          activity_modifier?: number | null
          character_id?: string | null
          cost?: number | null
          created_at?: string | null
          dp_allocated?: number | null
          dp_spent?: number | null
          id?: string
          is_active?: boolean | null
          manual_modifier?: number | null
          notes?: string | null
          professional_bonus?: number | null
          rank_bonus?: number | null
          ranks?: number | null
          skill_id?: string | null
          special_bonus?: number | null
          talent_bonus?: number | null
          temp_modifier?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_skills_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "character_traits_total"
            referencedColumns: ["character_id"]
          },
          {
            foreignKeyName: "character_skills_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "view_character_skills"
            referencedColumns: ["skill_id"]
          },
        ]
      }
      character_social_suffixes: {
        Row: {
          acquired_at_level: number | null
          acquired_reason: string | null
          character_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          social_suffix_id: string | null
        }
        Insert: {
          acquired_at_level?: number | null
          acquired_reason?: string | null
          character_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          social_suffix_id?: string | null
        }
        Update: {
          acquired_at_level?: number | null
          acquired_reason?: string | null
          character_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          social_suffix_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_social_suffixes_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "character_traits_total"
            referencedColumns: ["character_id"]
          },
          {
            foreignKeyName: "character_social_suffixes_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_social_suffixes_social_suffix_id_fkey"
            columns: ["social_suffix_id"]
            isOneToOne: false
            referencedRelation: "social_suffixes"
            referencedColumns: ["id"]
          },
        ]
      }
      character_stat_modifiers: {
        Row: {
          character_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          is_temporary: boolean | null
          modifier_value: number
          notes: string | null
          source_name: string | null
          source_type: string
          stat_id: string
        }
        Insert: {
          character_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_temporary?: boolean | null
          modifier_value: number
          notes?: string | null
          source_name?: string | null
          source_type: string
          stat_id: string
        }
        Update: {
          character_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_temporary?: boolean | null
          modifier_value?: number
          notes?: string | null
          source_name?: string | null
          source_type?: string
          stat_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_stat_modifiers_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "character_traits_total"
            referencedColumns: ["character_id"]
          },
          {
            foreignKeyName: "character_stat_modifiers_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_stat_modifiers_stat_id_fkey"
            columns: ["stat_id"]
            isOneToOne: false
            referencedRelation: "character_stats_total"
            referencedColumns: ["stat_id"]
          },
          {
            foreignKeyName: "character_stat_modifiers_stat_id_fkey"
            columns: ["stat_id"]
            isOneToOne: false
            referencedRelation: "stats"
            referencedColumns: ["id"]
          },
        ]
      }
      character_stat_special_allocations: {
        Row: {
          allocated_points: number
          character_id: string
          created_at: string | null
          id: string
          notes: string | null
          race_special_rule_id: string | null
          stat_id: string
        }
        Insert: {
          allocated_points?: number
          character_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          race_special_rule_id?: string | null
          stat_id: string
        }
        Update: {
          allocated_points?: number
          character_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          race_special_rule_id?: string | null
          stat_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_stat_special_allocations_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "character_traits_total"
            referencedColumns: ["character_id"]
          },
          {
            foreignKeyName: "character_stat_special_allocations_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_stat_special_allocations_race_special_rule_id_fkey"
            columns: ["race_special_rule_id"]
            isOneToOne: false
            referencedRelation: "race_special_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_stat_special_allocations_stat_id_fkey"
            columns: ["stat_id"]
            isOneToOne: false
            referencedRelation: "character_stats_total"
            referencedColumns: ["stat_id"]
          },
          {
            foreignKeyName: "character_stat_special_allocations_stat_id_fkey"
            columns: ["stat_id"]
            isOneToOne: false
            referencedRelation: "stats"
            referencedColumns: ["id"]
          },
        ]
      }
      character_stats: {
        Row: {
          base_value: number | null
          character_id: string | null
          id: string
          notes: string | null
          permanent_modifier: number | null
          race_modifier: number | null
          special_modifier: number | null
          stat_bonus: number | null
          stat_id: string | null
          stat_roll: number | null
          temp_modifier: number | null
          temporary_modifier: number | null
          total_bonus: number | null
        }
        Insert: {
          base_value?: number | null
          character_id?: string | null
          id?: string
          notes?: string | null
          permanent_modifier?: number | null
          race_modifier?: number | null
          special_modifier?: number | null
          stat_bonus?: number | null
          stat_id?: string | null
          stat_roll?: number | null
          temp_modifier?: number | null
          temporary_modifier?: number | null
          total_bonus?: number | null
        }
        Update: {
          base_value?: number | null
          character_id?: string | null
          id?: string
          notes?: string | null
          permanent_modifier?: number | null
          race_modifier?: number | null
          special_modifier?: number | null
          stat_bonus?: number | null
          stat_id?: string | null
          stat_roll?: number | null
          temp_modifier?: number | null
          temporary_modifier?: number | null
          total_bonus?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "character_stats_stat_id_fkey"
            columns: ["stat_id"]
            isOneToOne: false
            referencedRelation: "character_stats_total"
            referencedColumns: ["stat_id"]
          },
          {
            foreignKeyName: "character_stats_stat_id_fkey"
            columns: ["stat_id"]
            isOneToOne: false
            referencedRelation: "stats"
            referencedColumns: ["id"]
          },
        ]
      }
      character_talent_choices: {
        Row: {
          bonus: number
          category_id: string | null
          character_talent_id: string
          choice_type: string
          created_at: string | null
          id: string
          notes: string | null
          skill_id: string | null
          stat_id: string | null
          weapon_id: string | null
        }
        Insert: {
          bonus?: number
          category_id?: string | null
          character_talent_id: string
          choice_type: string
          created_at?: string | null
          id?: string
          notes?: string | null
          skill_id?: string | null
          stat_id?: string | null
          weapon_id?: string | null
        }
        Update: {
          bonus?: number
          category_id?: string | null
          character_talent_id?: string
          choice_type?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          skill_id?: string | null
          stat_id?: string | null
          weapon_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_talent_choices_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_talent_choices_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "character_categories_total"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "character_talent_choices_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "view_character_skills"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "character_talent_choices_character_talent_id_fkey"
            columns: ["character_talent_id"]
            isOneToOne: false
            referencedRelation: "character_talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_talent_choices_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_talent_choices_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "view_character_skills"
            referencedColumns: ["skill_id"]
          },
          {
            foreignKeyName: "character_talent_choices_stat_id_fkey"
            columns: ["stat_id"]
            isOneToOne: false
            referencedRelation: "character_stats_total"
            referencedColumns: ["stat_id"]
          },
          {
            foreignKeyName: "character_talent_choices_stat_id_fkey"
            columns: ["stat_id"]
            isOneToOne: false
            referencedRelation: "stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_talent_choices_weapon_id_fkey"
            columns: ["weapon_id"]
            isOneToOne: false
            referencedRelation: "weapons"
            referencedColumns: ["id"]
          },
        ]
      }
      character_talents: {
        Row: {
          acquired_level: number | null
          approved_by_dm: boolean
          character_id: string
          created_at: string | null
          id: string
          notes: string | null
          talent_id: string
          times_taken: number
        }
        Insert: {
          acquired_level?: number | null
          approved_by_dm?: boolean
          character_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          talent_id: string
          times_taken?: number
        }
        Update: {
          acquired_level?: number | null
          approved_by_dm?: boolean
          character_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          talent_id?: string
          times_taken?: number
        }
        Relationships: [
          {
            foreignKeyName: "character_talents_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "character_traits_total"
            referencedColumns: ["character_id"]
          },
          {
            foreignKeyName: "character_talents_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_talents_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      character_temporary_modifiers: {
        Row: {
          active: boolean | null
          applies_to: string
          character_id: string | null
          created_at: string | null
          game_master_id: string | null
          id: string
          modifier_value: number
          name: string
          notes: string | null
          target_name: string | null
        }
        Insert: {
          active?: boolean | null
          applies_to: string
          character_id?: string | null
          created_at?: string | null
          game_master_id?: string | null
          id?: string
          modifier_value: number
          name: string
          notes?: string | null
          target_name?: string | null
        }
        Update: {
          active?: boolean | null
          applies_to?: string
          character_id?: string | null
          created_at?: string | null
          game_master_id?: string | null
          id?: string
          modifier_value?: number
          name?: string
          notes?: string | null
          target_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_temporary_modifiers_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "character_traits_total"
            referencedColumns: ["character_id"]
          },
          {
            foreignKeyName: "character_temporary_modifiers_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_temporary_modifiers_game_master_id_fkey"
            columns: ["game_master_id"]
            isOneToOne: false
            referencedRelation: "dungeon_masters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_training_package_choices: {
        Row: {
          character_training_package_id: string
          chosen_weapon_id: string
          created_at: string | null
          id: string
          training_package_choice_id: string
        }
        Insert: {
          character_training_package_id: string
          chosen_weapon_id: string
          created_at?: string | null
          id?: string
          training_package_choice_id: string
        }
        Update: {
          character_training_package_id?: string
          chosen_weapon_id?: string
          created_at?: string | null
          id?: string
          training_package_choice_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_training_package_ch_character_training_package_i_fkey"
            columns: ["character_training_package_id"]
            isOneToOne: false
            referencedRelation: "character_training_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_training_package_choi_training_package_choice_id_fkey"
            columns: ["training_package_choice_id"]
            isOneToOne: false
            referencedRelation: "training_package_choices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_training_package_choices_chosen_weapon_id_fkey"
            columns: ["chosen_weapon_id"]
            isOneToOne: false
            referencedRelation: "weapons"
            referencedColumns: ["id"]
          },
        ]
      }
      character_training_packages: {
        Row: {
          acquired_at_level: number | null
          character_id: string
          created_at: string | null
          dp_paid: number
          id: string
          notes: string | null
          training_package_id: string
        }
        Insert: {
          acquired_at_level?: number | null
          character_id: string
          created_at?: string | null
          dp_paid: number
          id?: string
          notes?: string | null
          training_package_id: string
        }
        Update: {
          acquired_at_level?: number | null
          character_id?: string
          created_at?: string | null
          dp_paid?: number
          id?: string
          notes?: string | null
          training_package_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_training_packages_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "character_traits_total"
            referencedColumns: ["character_id"]
          },
          {
            foreignKeyName: "character_training_packages_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_training_packages_training_package_id_fkey"
            columns: ["training_package_id"]
            isOneToOne: false
            referencedRelation: "training_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      character_traits: {
        Row: {
          character_id: string
          created_at: string
          dp_allocated: number
          gm_bonus: number
          id: string
          is_active: boolean
          notes: string | null
          ranks: number
          special_modifier: number
          talent_bonus: number
          temp_modifier: number
          trait_id: string
          updated_at: string
        }
        Insert: {
          character_id: string
          created_at?: string
          dp_allocated?: number
          gm_bonus?: number
          id?: string
          is_active?: boolean
          notes?: string | null
          ranks?: number
          special_modifier?: number
          talent_bonus?: number
          temp_modifier?: number
          trait_id: string
          updated_at?: string
        }
        Update: {
          character_id?: string
          created_at?: string
          dp_allocated?: number
          gm_bonus?: number
          id?: string
          is_active?: boolean
          notes?: string | null
          ranks?: number
          special_modifier?: number
          talent_bonus?: number
          temp_modifier?: number
          trait_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_traits_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "character_traits_total"
            referencedColumns: ["character_id"]
          },
          {
            foreignKeyName: "character_traits_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_traits_trait_id_fkey"
            columns: ["trait_id"]
            isOneToOne: false
            referencedRelation: "character_traits_total"
            referencedColumns: ["trait_id"]
          },
          {
            foreignKeyName: "character_traits_trait_id_fkey"
            columns: ["trait_id"]
            isOneToOne: false
            referencedRelation: "traits"
            referencedColumns: ["id"]
          },
        ]
      }
      character_weapon_skill: {
        Row: {
          activity_modifier: number | null
          adolescent_ranks: number | null
          base_skill_id: string | null
          character_id: string | null
          cost: number | null
          created_at: string | null
          dp_allocated: number | null
          id: string
          is_active: boolean | null
          manual_modifier: number | null
          natural_value: number | null
          notes: string | null
          package_ranks: number | null
          professional_bonus: number | null
          ranks: number | null
          special_bonus: number | null
          special_modifier: number | null
          special_notes: string | null
          talent_bonus: number | null
          temp_modifier: number | null
          total: number | null
          total_ranks: number | null
          updated_at: string | null
          weapon_affinity_value: number | null
          weapon_id: string | null
        }
        Insert: {
          activity_modifier?: number | null
          adolescent_ranks?: number | null
          base_skill_id?: string | null
          character_id?: string | null
          cost?: number | null
          created_at?: string | null
          dp_allocated?: number | null
          id?: string
          is_active?: boolean | null
          manual_modifier?: number | null
          natural_value?: number | null
          notes?: string | null
          package_ranks?: number | null
          professional_bonus?: number | null
          ranks?: number | null
          special_bonus?: number | null
          special_modifier?: number | null
          special_notes?: string | null
          talent_bonus?: number | null
          temp_modifier?: number | null
          total?: number | null
          total_ranks?: number | null
          updated_at?: string | null
          weapon_affinity_value?: number | null
          weapon_id?: string | null
        }
        Update: {
          activity_modifier?: number | null
          adolescent_ranks?: number | null
          base_skill_id?: string | null
          character_id?: string | null
          cost?: number | null
          created_at?: string | null
          dp_allocated?: number | null
          id?: string
          is_active?: boolean | null
          manual_modifier?: number | null
          natural_value?: number | null
          notes?: string | null
          package_ranks?: number | null
          professional_bonus?: number | null
          ranks?: number | null
          special_bonus?: number | null
          special_modifier?: number | null
          special_notes?: string | null
          talent_bonus?: number | null
          temp_modifier?: number | null
          total?: number | null
          total_ranks?: number | null
          updated_at?: string | null
          weapon_affinity_value?: number | null
          weapon_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_weapon_skill_base_skill_id_fkey"
            columns: ["base_skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_weapon_skill_base_skill_id_fkey"
            columns: ["base_skill_id"]
            isOneToOne: false
            referencedRelation: "view_character_skills"
            referencedColumns: ["skill_id"]
          },
          {
            foreignKeyName: "character_weapon_skill_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "character_traits_total"
            referencedColumns: ["character_id"]
          },
          {
            foreignKeyName: "character_weapon_skill_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_weapon_skill_weapon_id_fkey"
            columns: ["weapon_id"]
            isOneToOne: false
            referencedRelation: "weapons"
            referencedColumns: ["id"]
          },
        ]
      }
      characters: {
        Row: {
          age: number | null
          appearance: number | null
          appearance_notes: string | null
          appearance_roll: number | null
          available_dp: number | null
          birthplace_id: string | null
          character_name: string | null
          created_at: string | null
          dm_id: string | null
          has_profession_adaptability: boolean
          height: number | null
          id: string
          level: number | null
          name: string
          notes: string | null
          owner_user_id: string | null
          player_name: string | null
          profession_id: string | null
          race_id: string | null
          status: string | null
          total_dp: number | null
          weight: number | null
          world_id: string | null
        }
        Insert: {
          age?: number | null
          appearance?: number | null
          appearance_notes?: string | null
          appearance_roll?: number | null
          available_dp?: number | null
          birthplace_id?: string | null
          character_name?: string | null
          created_at?: string | null
          dm_id?: string | null
          has_profession_adaptability?: boolean
          height?: number | null
          id?: string
          level?: number | null
          name: string
          notes?: string | null
          owner_user_id?: string | null
          player_name?: string | null
          profession_id?: string | null
          race_id?: string | null
          status?: string | null
          total_dp?: number | null
          weight?: number | null
          world_id?: string | null
        }
        Update: {
          age?: number | null
          appearance?: number | null
          appearance_notes?: string | null
          appearance_roll?: number | null
          available_dp?: number | null
          birthplace_id?: string | null
          character_name?: string | null
          created_at?: string | null
          dm_id?: string | null
          has_profession_adaptability?: boolean
          height?: number | null
          id?: string
          level?: number | null
          name?: string
          notes?: string | null
          owner_user_id?: string | null
          player_name?: string | null
          profession_id?: string | null
          race_id?: string | null
          status?: string | null
          total_dp?: number | null
          weight?: number | null
          world_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "characters_birthplace_id_fkey"
            columns: ["birthplace_id"]
            isOneToOne: false
            referencedRelation: "birthplaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "characters_dm_id_fkey"
            columns: ["dm_id"]
            isOneToOne: false
            referencedRelation: "dungeon_masters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "characters_profession_id_fkey"
            columns: ["profession_id"]
            isOneToOne: false
            referencedRelation: "professions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "characters_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "characters_world_id_fkey"
            columns: ["world_id"]
            isOneToOne: false
            referencedRelation: "worlds"
            referencedColumns: ["id"]
          },
        ]
      }
      dungeon_masters: {
        Row: {
          created_at: string | null
          id: string
          name: string
          notes: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          notes?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      game_entity_types: {
        Row: {
          description: string | null
          entity_code: string
          entity_name: string
          id: number
        }
        Insert: {
          description?: string | null
          entity_code: string
          entity_name: string
          id: number
        }
        Update: {
          description?: string | null
          entity_code?: string
          entity_name?: string
          id?: number
        }
        Relationships: []
      }
      game_values: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      language_rank_levels: {
        Row: {
          description: string
          id: string
          mode: string
          rank: number
        }
        Insert: {
          description: string
          id?: string
          mode: string
          rank: number
        }
        Update: {
          description?: string
          id?: string
          mode?: string
          rank?: number
        }
        Relationships: []
      }
      languages: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      level_progression: {
        Row: {
          level: number
          max_total_dp: number | null
          min_total_dp: number
          notes: string | null
        }
        Insert: {
          level: number
          max_total_dp?: number | null
          min_total_dp: number
          notes?: string | null
        }
        Update: {
          level?: number
          max_total_dp?: number | null
          min_total_dp?: number
          notes?: string | null
        }
        Relationships: []
      }
      life_activity_modifier_rules: {
        Row: {
          applies_to: string
          id: string
          is_active: boolean | null
          modifier_value: number
          threshold_percent: number
        }
        Insert: {
          applies_to?: string
          id?: string
          is_active?: boolean | null
          modifier_value: number
          threshold_percent: number
        }
        Update: {
          applies_to?: string
          id?: string
          is_active?: boolean | null
          modifier_value?: number
          threshold_percent?: number
        }
        Relationships: []
      }
      professions: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      race_adolescent_rank_rules: {
        Row: {
          category_id: string | null
          created_at: string | null
          id: string
          language_id: string | null
          notes: string | null
          race_id: string
          ranks_granted: number
          skill_id: string | null
          target_type: string
          trait_id: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          language_id?: string | null
          notes?: string | null
          race_id: string
          ranks_granted: number
          skill_id?: string | null
          target_type: string
          trait_id?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          language_id?: string | null
          notes?: string | null
          race_id?: string
          ranks_granted?: number
          skill_id?: string | null
          target_type?: string
          trait_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "race_adolescent_rank_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "race_adolescent_rank_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "character_categories_total"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "race_adolescent_rank_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "view_character_skills"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "race_adolescent_rank_rules_language_id_fkey"
            columns: ["language_id"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "race_adolescent_rank_rules_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "race_adolescent_rank_rules_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "race_adolescent_rank_rules_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "view_character_skills"
            referencedColumns: ["skill_id"]
          },
          {
            foreignKeyName: "race_adolescent_rank_rules_trait_id_fkey"
            columns: ["trait_id"]
            isOneToOne: false
            referencedRelation: "character_traits_total"
            referencedColumns: ["trait_id"]
          },
          {
            foreignKeyName: "race_adolescent_rank_rules_trait_id_fkey"
            columns: ["trait_id"]
            isOneToOne: false
            referencedRelation: "traits"
            referencedColumns: ["id"]
          },
        ]
      }
      race_age_ranges: {
        Row: {
          created_at: string | null
          id: string
          life_stage: string
          max_age: number | null
          min_age: number
          notes: string | null
          race_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          life_stage: string
          max_age?: number | null
          min_age: number
          notes?: string | null
          race_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          life_stage?: string
          max_age?: number | null
          min_age?: number
          notes?: string | null
          race_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "race_age_ranges_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
        ]
      }
      race_category_modifiers: {
        Row: {
          category_id: string
          created_at: string | null
          id: string
          modifier_value: number
          notes: string | null
          race_id: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          id?: string
          modifier_value: number
          notes?: string | null
          race_id: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          id?: string
          modifier_value?: number
          notes?: string | null
          race_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "race_category_modifiers_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "race_category_modifiers_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "character_categories_total"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "race_category_modifiers_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "view_character_skills"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "race_category_modifiers_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
        ]
      }
      race_height_ranges: {
        Row: {
          created_at: string | null
          id: string
          life_stage: string
          max_height_cm: number
          min_height_cm: number
          notes: string | null
          race_id: string
          sex: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          life_stage: string
          max_height_cm: number
          min_height_cm: number
          notes?: string | null
          race_id: string
          sex?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          life_stage?: string
          max_height_cm?: number
          min_height_cm?: number
          notes?: string | null
          race_id?: string
          sex?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "race_height_ranges_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
        ]
      }
      race_language_bonuses: {
        Row: {
          base_ranks: number
          created_at: string | null
          id: string
          language_id: string
          notes: string | null
          race_id: string
        }
        Insert: {
          base_ranks: number
          created_at?: string | null
          id?: string
          language_id: string
          notes?: string | null
          race_id: string
        }
        Update: {
          base_ranks?: number
          created_at?: string | null
          id?: string
          language_id?: string
          notes?: string | null
          race_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "race_language_bonuses_language_id_fkey"
            columns: ["language_id"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "race_language_bonuses_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
        ]
      }
      race_sexes: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          race_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          race_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          race_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "race_sexes_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
        ]
      }
      race_special_rules: {
        Row: {
          created_at: string | null
          id: string
          max_per_target: number | null
          notes: string | null
          race_id: string
          rule_type: string
          target_type: string
          total_points: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          max_per_target?: number | null
          notes?: string | null
          race_id: string
          rule_type: string
          target_type: string
          total_points: number
        }
        Update: {
          created_at?: string | null
          id?: string
          max_per_target?: number | null
          notes?: string | null
          race_id?: string
          rule_type?: string
          target_type?: string
          total_points?: number
        }
        Relationships: [
          {
            foreignKeyName: "race_special_rules_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
        ]
      }
      race_stat_modifiers: {
        Row: {
          created_at: string | null
          id: string
          modifier_value: number
          notes: string | null
          race_id: string
          stat_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          modifier_value: number
          notes?: string | null
          race_id: string
          stat_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          modifier_value?: number
          notes?: string | null
          race_id?: string
          stat_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "race_stat_modifiers_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "race_stat_modifiers_stat_id_fkey"
            columns: ["stat_id"]
            isOneToOne: false
            referencedRelation: "character_stats_total"
            referencedColumns: ["stat_id"]
          },
          {
            foreignKeyName: "race_stat_modifiers_stat_id_fkey"
            columns: ["stat_id"]
            isOneToOne: false
            referencedRelation: "stats"
            referencedColumns: ["id"]
          },
        ]
      }
      race_talents: {
        Row: {
          created_at: string | null
          id: string
          is_required: boolean
          max_free_choices: number
          notes: string | null
          race_id: string
          talent_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_required?: boolean
          max_free_choices?: number
          notes?: string | null
          race_id: string
          talent_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_required?: boolean
          max_free_choices?: number
          notes?: string | null
          race_id?: string
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "race_talents_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "race_talents_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      race_trait_modifiers: {
        Row: {
          created_at: string | null
          id: string
          modifier_value: number
          notes: string | null
          race_id: string
          trait_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          modifier_value: number
          notes?: string | null
          race_id: string
          trait_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          modifier_value?: number
          notes?: string | null
          race_id?: string
          trait_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "race_trait_modifiers_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "race_trait_modifiers_trait_id_fkey"
            columns: ["trait_id"]
            isOneToOne: false
            referencedRelation: "character_traits_total"
            referencedColumns: ["trait_id"]
          },
          {
            foreignKeyName: "race_trait_modifiers_trait_id_fkey"
            columns: ["trait_id"]
            isOneToOne: false
            referencedRelation: "traits"
            referencedColumns: ["id"]
          },
        ]
      }
      race_weight_ranges: {
        Row: {
          created_at: string | null
          id: string
          life_stage: string
          max_weight_kg: number
          min_weight_kg: number
          notes: string | null
          race_id: string
          sex: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          life_stage: string
          max_weight_kg: number
          min_weight_kg: number
          notes?: string | null
          race_id: string
          sex?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          life_stage?: string
          max_weight_kg?: number
          min_weight_kg?: number
          notes?: string | null
          race_id?: string
          sex?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "race_weight_ranges_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
        ]
      }
      races: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      rank_bonus_progression: {
        Row: {
          rank_bonus: number
          ranks: number
        }
        Insert: {
          rank_bonus: number
          ranks: number
        }
        Update: {
          rank_bonus?: number
          ranks?: number
        }
        Relationships: []
      }
      requirement_value_types: {
        Row: {
          code: string
          description: string | null
          id: number
          name: string
        }
        Insert: {
          code: string
          description?: string | null
          id: number
          name: string
        }
        Update: {
          code?: string
          description?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          allows_specialization: boolean | null
          category_id: string | null
          character_id: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_custom: boolean | null
          name: string
          stat_id: string | null
        }
        Insert: {
          allows_specialization?: boolean | null
          category_id?: string | null
          character_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_custom?: boolean | null
          name: string
          stat_id?: string | null
        }
        Update: {
          allows_specialization?: boolean | null
          category_id?: string | null
          character_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_custom?: boolean | null
          name?: string
          stat_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skills_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skills_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "character_categories_total"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "skills_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "view_character_skills"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "skills_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "character_traits_total"
            referencedColumns: ["character_id"]
          },
          {
            foreignKeyName: "skills_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skills_stat_id_fkey"
            columns: ["stat_id"]
            isOneToOne: false
            referencedRelation: "character_stats_total"
            referencedColumns: ["stat_id"]
          },
          {
            foreignKeyName: "skills_stat_id_fkey"
            columns: ["stat_id"]
            isOneToOne: false
            referencedRelation: "stats"
            referencedColumns: ["id"]
          },
        ]
      }
      social_suffixes: {
        Row: {
          description: string | null
          id: string
          name: string
        }
        Insert: {
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      stat_cost_rules: {
        Row: {
          dp_cost: number
          stat_total: number
        }
        Insert: {
          dp_cost: number
          stat_total: number
        }
        Update: {
          dp_cost?: number
          stat_total?: number
        }
        Relationships: []
      }
      stat_progression: {
        Row: {
          bonus: number
          cost_skill: number | null
          dps: number | null
          stat_value: number
        }
        Insert: {
          bonus: number
          cost_skill?: number | null
          dps?: number | null
          stat_value: number
        }
        Update: {
          bonus?: number
          cost_skill?: number | null
          dps?: number | null
          stat_value?: number
        }
        Relationships: []
      }
      stats: {
        Row: {
          code: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          code?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          code?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      talent_category_bonuses: {
        Row: {
          bonus: number
          category_id: string
          created_at: string | null
          id: string
          notes: string | null
          requirement_value_type_id: number | null
          talent_id: string
        }
        Insert: {
          bonus?: number
          category_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          requirement_value_type_id?: number | null
          talent_id: string
        }
        Update: {
          bonus?: number
          category_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          requirement_value_type_id?: number | null
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_category_bonuses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_category_bonuses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "character_categories_total"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "talent_category_bonuses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "view_character_skills"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "talent_category_bonuses_requirement_value_type_id_fkey"
            columns: ["requirement_value_type_id"]
            isOneToOne: false
            referencedRelation: "requirement_value_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_category_bonuses_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_game_value_bonuses: {
        Row: {
          condition: string | null
          created_at: string
          game_value_id: string
          id: string
          is_active: boolean
          modifier: number
          notes: string | null
          requirement_value_type_id: number
          talent_id: string
        }
        Insert: {
          condition?: string | null
          created_at?: string
          game_value_id: string
          id?: string
          is_active?: boolean
          modifier: number
          notes?: string | null
          requirement_value_type_id: number
          talent_id: string
        }
        Update: {
          condition?: string | null
          created_at?: string
          game_value_id?: string
          id?: string
          is_active?: boolean
          modifier?: number
          notes?: string | null
          requirement_value_type_id?: number
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_game_value_bonuses_requirement_value_type_id_fkey"
            columns: ["requirement_value_type_id"]
            isOneToOne: false
            referencedRelation: "requirement_value_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_game_value_effects_game_value_id_fkey"
            columns: ["game_value_id"]
            isOneToOne: false
            referencedRelation: "game_values"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_game_value_effects_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_requirements: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          operator: string
          required_value: number | null
          requirement_type_id: number
          requirement_value_type_id: number | null
          talent_id: string
          target_id: string | null
          target_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          operator?: string
          required_value?: number | null
          requirement_type_id: number
          requirement_value_type_id?: number | null
          talent_id: string
          target_id?: string | null
          target_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          operator?: string
          required_value?: number | null
          requirement_type_id?: number
          requirement_value_type_id?: number | null
          talent_id?: string
          target_id?: string | null
          target_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_requirements_requirement_type_id_fkey"
            columns: ["requirement_type_id"]
            isOneToOne: false
            referencedRelation: "game_entity_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_requirements_requirement_value_type_id_fkey"
            columns: ["requirement_value_type_id"]
            isOneToOne: false
            referencedRelation: "requirement_value_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_requirements_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_skill_bonuses: {
        Row: {
          bonus: number
          created_at: string | null
          id: string
          notes: string | null
          requirement_value_type_id: number | null
          skill_id: string
          talent_id: string
        }
        Insert: {
          bonus?: number
          created_at?: string | null
          id?: string
          notes?: string | null
          requirement_value_type_id?: number | null
          skill_id: string
          talent_id: string
        }
        Update: {
          bonus?: number
          created_at?: string | null
          id?: string
          notes?: string | null
          requirement_value_type_id?: number | null
          skill_id?: string
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_skill_bonuses_requirement_value_type_id_fkey"
            columns: ["requirement_value_type_id"]
            isOneToOne: false
            referencedRelation: "requirement_value_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_skill_bonuses_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_skill_bonuses_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "view_character_skills"
            referencedColumns: ["skill_id"]
          },
          {
            foreignKeyName: "talent_skill_bonuses_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_stat_bonuses: {
        Row: {
          bonus: number
          created_at: string | null
          id: string
          notes: string | null
          requirement_value_type_id: number | null
          stat_id: string
          talent_id: string
        }
        Insert: {
          bonus?: number
          created_at?: string | null
          id?: string
          notes?: string | null
          requirement_value_type_id?: number | null
          stat_id: string
          talent_id: string
        }
        Update: {
          bonus?: number
          created_at?: string | null
          id?: string
          notes?: string | null
          requirement_value_type_id?: number | null
          stat_id?: string
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_stat_bonuses_requirement_value_type_id_fkey"
            columns: ["requirement_value_type_id"]
            isOneToOne: false
            referencedRelation: "requirement_value_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_stat_bonuses_stat_id_fkey"
            columns: ["stat_id"]
            isOneToOne: false
            referencedRelation: "character_stats_total"
            referencedColumns: ["stat_id"]
          },
          {
            foreignKeyName: "talent_stat_bonuses_stat_id_fkey"
            columns: ["stat_id"]
            isOneToOne: false
            referencedRelation: "stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_stat_bonuses_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_trait_bonuses: {
        Row: {
          bonus: number
          created_at: string | null
          id: string
          notes: string | null
          requirement_value_type_id: number | null
          talent_id: string
          trait_id: string
        }
        Insert: {
          bonus: number
          created_at?: string | null
          id?: string
          notes?: string | null
          requirement_value_type_id?: number | null
          talent_id: string
          trait_id: string
        }
        Update: {
          bonus?: number
          created_at?: string | null
          id?: string
          notes?: string | null
          requirement_value_type_id?: number | null
          talent_id?: string
          trait_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_trait_bonuses_requirement_value_type_id_fkey"
            columns: ["requirement_value_type_id"]
            isOneToOne: false
            referencedRelation: "requirement_value_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_trait_bonuses_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_trait_bonuses_trait_id_fkey"
            columns: ["trait_id"]
            isOneToOne: false
            referencedRelation: "character_traits_total"
            referencedColumns: ["trait_id"]
          },
          {
            foreignKeyName: "talent_trait_bonuses_trait_id_fkey"
            columns: ["trait_id"]
            isOneToOne: false
            referencedRelation: "traits"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_weapon_bonuses: {
        Row: {
          bonus: number
          created_at: string | null
          id: string
          notes: string | null
          requirement_value_type_id: number | null
          talent_id: string
          weapon_id: string
        }
        Insert: {
          bonus?: number
          created_at?: string | null
          id?: string
          notes?: string | null
          requirement_value_type_id?: number | null
          talent_id: string
          weapon_id: string
        }
        Update: {
          bonus?: number
          created_at?: string | null
          id?: string
          notes?: string | null
          requirement_value_type_id?: number | null
          talent_id?: string
          weapon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_weapon_bonuses_requirement_value_type_id_fkey"
            columns: ["requirement_value_type_id"]
            isOneToOne: false
            referencedRelation: "requirement_value_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_weapon_bonuses_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_weapon_bonuses_weapon_id_fkey"
            columns: ["weapon_id"]
            isOneToOne: false
            referencedRelation: "weapons"
            referencedColumns: ["id"]
          },
        ]
      }
      talents: {
        Row: {
          cost: number
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean
          is_level_1_only: boolean
          max_times_per_character: number
          name: string
          requires_dm_approval: boolean
          talent_type: string
        }
        Insert: {
          cost?: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_level_1_only?: boolean
          max_times_per_character?: number
          name: string
          requires_dm_approval?: boolean
          talent_type: string
        }
        Update: {
          cost?: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_level_1_only?: boolean
          max_times_per_character?: number
          name?: string
          requires_dm_approval?: boolean
          talent_type?: string
        }
        Relationships: []
      }
      training_package_categories: {
        Row: {
          category_id: string
          id: string
          notes: string | null
          ranks_granted: number
          training_package_id: string
        }
        Insert: {
          category_id: string
          id?: string
          notes?: string | null
          ranks_granted?: number
          training_package_id: string
        }
        Update: {
          category_id?: string
          id?: string
          notes?: string | null
          ranks_granted?: number
          training_package_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_package_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_package_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "character_categories_total"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "training_package_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "view_character_skills"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "training_package_categories_training_package_id_fkey"
            columns: ["training_package_id"]
            isOneToOne: false
            referencedRelation: "training_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      training_package_choices: {
        Row: {
          choice_name: string
          created_at: string | null
          id: string
          ranks_granted: number
          required_weapon_type_id: string | null
          training_package_id: string
        }
        Insert: {
          choice_name: string
          created_at?: string | null
          id?: string
          ranks_granted?: number
          required_weapon_type_id?: string | null
          training_package_id: string
        }
        Update: {
          choice_name?: string
          created_at?: string | null
          id?: string
          ranks_granted?: number
          required_weapon_type_id?: string | null
          training_package_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_package_choices_required_weapon_type_id_fkey"
            columns: ["required_weapon_type_id"]
            isOneToOne: false
            referencedRelation: "weapon_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_package_choices_training_package_id_fkey"
            columns: ["training_package_id"]
            isOneToOne: false
            referencedRelation: "training_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      training_package_skills: {
        Row: {
          id: string
          notes: string | null
          ranks_granted: number
          skill_id: string
          training_package_id: string
        }
        Insert: {
          id?: string
          notes?: string | null
          ranks_granted?: number
          skill_id: string
          training_package_id: string
        }
        Update: {
          id?: string
          notes?: string | null
          ranks_granted?: number
          skill_id?: string
          training_package_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_package_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_package_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "view_character_skills"
            referencedColumns: ["skill_id"]
          },
          {
            foreignKeyName: "training_package_skills_training_package_id_fkey"
            columns: ["training_package_id"]
            isOneToOne: false
            referencedRelation: "training_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      training_packages: {
        Row: {
          created_at: string | null
          created_by_dm_id: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          total_dp_cost: number
        }
        Insert: {
          created_at?: string | null
          created_by_dm_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          total_dp_cost: number
        }
        Update: {
          created_at?: string | null
          created_by_dm_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          total_dp_cost?: number
        }
        Relationships: []
      }
      traits: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          primary_stat_id: string
          secondary_stat_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          primary_stat_id: string
          secondary_stat_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          primary_stat_id?: string
          secondary_stat_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "traits_primary_stat_id_fkey"
            columns: ["primary_stat_id"]
            isOneToOne: false
            referencedRelation: "character_stats_total"
            referencedColumns: ["stat_id"]
          },
          {
            foreignKeyName: "traits_primary_stat_id_fkey"
            columns: ["primary_stat_id"]
            isOneToOne: false
            referencedRelation: "stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traits_secondary_stat_id_fkey"
            columns: ["secondary_stat_id"]
            isOneToOne: false
            referencedRelation: "character_stats_total"
            referencedColumns: ["stat_id"]
          },
          {
            foreignKeyName: "traits_secondary_stat_id_fkey"
            columns: ["secondary_stat_id"]
            isOneToOne: false
            referencedRelation: "stats"
            referencedColumns: ["id"]
          },
        ]
      }
      weapon_affinity: {
        Row: {
          affinity_modifier: number
          created_at: string | null
          id: string
          notes: string | null
          source_weapon_id: string
          target_weapon_id: string
        }
        Insert: {
          affinity_modifier?: number
          created_at?: string | null
          id?: string
          notes?: string | null
          source_weapon_id: string
          target_weapon_id: string
        }
        Update: {
          affinity_modifier?: number
          created_at?: string | null
          id?: string
          notes?: string | null
          source_weapon_id?: string
          target_weapon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "weapon_affinity_source_weapon_id_fkey"
            columns: ["source_weapon_id"]
            isOneToOne: false
            referencedRelation: "weapons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weapon_affinity_target_weapon_id_fkey"
            columns: ["target_weapon_id"]
            isOneToOne: false
            referencedRelation: "weapons"
            referencedColumns: ["id"]
          },
        ]
      }
      weapon_types: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      weapons: {
        Row: {
          allows_specialization: boolean | null
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_custom: boolean | null
          name: string
          stat_id: string | null
          weapon_type_id: string | null
        }
        Insert: {
          allows_specialization?: boolean | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_custom?: boolean | null
          name: string
          stat_id?: string | null
          weapon_type_id?: string | null
        }
        Update: {
          allows_specialization?: boolean | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_custom?: boolean | null
          name?: string
          stat_id?: string | null
          weapon_type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "weapons_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weapons_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "character_categories_total"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "weapons_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "view_character_skills"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "weapons_stat_id_fkey"
            columns: ["stat_id"]
            isOneToOne: false
            referencedRelation: "character_stats_total"
            referencedColumns: ["stat_id"]
          },
          {
            foreignKeyName: "weapons_stat_id_fkey"
            columns: ["stat_id"]
            isOneToOne: false
            referencedRelation: "stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weapons_weapon_type_id_fkey"
            columns: ["weapon_type_id"]
            isOneToOne: false
            referencedRelation: "weapon_types"
            referencedColumns: ["id"]
          },
        ]
      }
      worlds: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      character_categories_total: {
        Row: {
          adolescent_ranks: number | null
          category_group: string | null
          category_id: string | null
          category_name: string | null
          character_id: string | null
          character_name: string | null
          cost: number | null
          dp_allocated: number | null
          gm_bonus: number | null
          modified_total: number | null
          notes: string | null
          rank_value: number | null
          ranks: number | null
          stat_code: string | null
          stat_name: string | null
          stat_value: number | null
          talent_bonus: number | null
          total: number | null
        }
        Relationships: [
          {
            foreignKeyName: "character_categories_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "character_traits_total"
            referencedColumns: ["character_id"]
          },
          {
            foreignKeyName: "character_categories_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_category_talent_bonuses: {
        Row: {
          category_id: string | null
          character_id: string | null
          talent_bonus: number | null
        }
        Relationships: [
          {
            foreignKeyName: "character_talents_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "character_traits_total"
            referencedColumns: ["character_id"]
          },
          {
            foreignKeyName: "character_talents_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_category_bonuses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_category_bonuses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "character_categories_total"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "talent_category_bonuses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "view_character_skills"
            referencedColumns: ["category_id"]
          },
        ]
      }
      character_skill_talent_bonuses: {
        Row: {
          character_id: string | null
          skill_id: string | null
          talent_bonus: number | null
        }
        Relationships: [
          {
            foreignKeyName: "character_talents_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "character_traits_total"
            referencedColumns: ["character_id"]
          },
          {
            foreignKeyName: "character_talents_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_skill_bonuses_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_skill_bonuses_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "view_character_skills"
            referencedColumns: ["skill_id"]
          },
        ]
      }
      character_stat_talent_bonuses: {
        Row: {
          character_id: string | null
          stat_id: string | null
          talent_bonus: number | null
        }
        Relationships: [
          {
            foreignKeyName: "character_talents_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "character_traits_total"
            referencedColumns: ["character_id"]
          },
          {
            foreignKeyName: "character_talents_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_stat_bonuses_stat_id_fkey"
            columns: ["stat_id"]
            isOneToOne: false
            referencedRelation: "character_stats_total"
            referencedColumns: ["stat_id"]
          },
          {
            foreignKeyName: "talent_stat_bonuses_stat_id_fkey"
            columns: ["stat_id"]
            isOneToOne: false
            referencedRelation: "stats"
            referencedColumns: ["id"]
          },
        ]
      }
      character_stats_total: {
        Row: {
          base_bonus: number | null
          birthplace_modifier: number | null
          character_id: string | null
          character_name: string | null
          cost_lookup_value: number | null
          origin_modifier: number | null
          race_modifier: number | null
          special_modifier: number | null
          stat_code: string | null
          stat_id: string | null
          stat_name: string | null
          stat_roll: number | null
          total_bonus: number | null
        }
        Relationships: []
      }
      character_traits_total: {
        Row: {
          birthplace_modifier: number | null
          character_id: string | null
          character_name: string | null
          cost: number | null
          primary_stat_code: string | null
          race_modifier: number | null
          secondary_stat_code: string | null
          stat_value: number | null
          total_trait_stat: number | null
          trait_id: string | null
          trait_name: string | null
        }
        Relationships: []
      }
      character_weapon_talent_bonuses: {
        Row: {
          character_id: string | null
          talent_bonus: number | null
          weapon_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_talents_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "character_traits_total"
            referencedColumns: ["character_id"]
          },
          {
            foreignKeyName: "character_talents_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_weapon_bonuses_weapon_id_fkey"
            columns: ["weapon_id"]
            isOneToOne: false
            referencedRelation: "weapons"
            referencedColumns: ["id"]
          },
        ]
      }
      view_character_skills: {
        Row: {
          activity_modifier: number | null
          category: string | null
          category_id: string | null
          category_value: number | null
          character_id: string | null
          cost: number | null
          dp_allocation: number | null
          manual_modifier: number | null
          modified: number | null
          professional_bonus: number | null
          rank_value: number | null
          ranks: number | null
          skill: string | null
          skill_id: string | null
          skill_stat: string | null
          special: number | null
          stat_value: number | null
          talent: number | null
          temp_modifier: number | null
          total: number | null
        }
        Relationships: [
          {
            foreignKeyName: "character_skills_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "character_traits_total"
            referencedColumns: ["character_id"]
          },
          {
            foreignKeyName: "character_skills_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      view_weapon_affinity: {
        Row: {
          affinity_modifier: number | null
          created_at: string | null
          id: string | null
          notes: string | null
          source_weapon: string | null
          target_weapon: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      recalc_character_weapon_skill_from_source: {
        Args: { p_character_id: string; p_source_weapon_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
