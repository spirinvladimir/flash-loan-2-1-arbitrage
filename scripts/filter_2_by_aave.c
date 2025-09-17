#include <float.h>
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <inttypes.h>
#include <string.h>
#include "cJSON.h"

#define PROGRESS(curr, total) do { \
    int p = (curr * 40) / total; \
    printf("\r[%.*s%*s] %d%%", p, "########################################", 40-p, "", (curr*100)/total); \
    fflush(stdout); \
} while(0)


int end = -1;
int *aave_indexes = NULL;
int aave_count = 0;
cJSON *tokens_array = NULL;

const char* get_address_by_index(int index) {
    if (tokens_array == NULL || index < 0 || index >= cJSON_GetArraySize(tokens_array)) {
        return NULL;
    }
    cJSON *address_item = cJSON_GetArrayItem(tokens_array, index);
    return cJSON_GetStringValue(address_item);
}

int main() {
    // Load tokens.json
    FILE *tokens_file = fopen("data/tokens.json", "r");
    if (tokens_file == NULL) {
        printf("Error: Cannot open data/tokens.json\n");
        return 1;
    }

    fseek(tokens_file, 0, SEEK_END);
    long tokens_file_size = ftell(tokens_file);
    fseek(tokens_file, 0, SEEK_SET);

    char *tokens_json_string = malloc(tokens_file_size + 1);
    fread(tokens_json_string, 1, tokens_file_size, tokens_file);
    tokens_json_string[tokens_file_size] = '\0';
    fclose(tokens_file);

    tokens_array = cJSON_Parse(tokens_json_string);
    free(tokens_json_string);

    if (tokens_array == NULL) {
        printf("Error: Failed to parse tokens.json\n");
        return 1;
    }

    printf("Loaded %d token addresses\n", cJSON_GetArraySize(tokens_array));
    FILE *fin = fopen("aave_tokens_indexes.bin", "rb");
    fread(&aave_count, sizeof(int), 1, fin);
    aave_indexes = malloc(aave_count * sizeof(int));
    fread(aave_indexes, sizeof(int), aave_count, fin);
    fclose(fin);
    printf("Loaded %d AAVE token indexes\n", aave_count);

    FILE *f3 = fopen("data/2_pools.bin", "rb");
    fseek(f3, 0, SEEK_END);
    long f3_size = ftell(f3);
    int total = f3_size / (3 * sizeof(int));
    fseek(f3, 0, SEEK_SET);
    int (*combs3)[3] = malloc(total * sizeof(int[3]));
    fread(combs3, sizeof(int[3]), total, f3);
    fclose(f3);
    int filtered_count = 0;
    FILE *fout = fopen("data/2_pools_filtered_aave.bin", "wb");

    // Create JSON array for the mapping
    cJSON *json_output = cJSON_CreateArray();

    for (int i = 0; i < total - 1; i++) {
        int A = combs3[i][0];
        int B = combs3[i][1];
        int C = combs3[i][2];

        int is_aave_token = 0;
        for (int j = 0; j < aave_count; j++) {
            if (aave_indexes[j] == A || aave_indexes[j] == C) {
                is_aave_token = 1;
                break;
            }
        }

        if (is_aave_token) {
            filtered_count++;
            fwrite(&A, sizeof(int), 1, fout);
            fwrite(&B, sizeof(int), 1, fout);
            fwrite(&C, sizeof(int), 1, fout);
            printf("[%d, %d, %d],", A, B, C);

            // Create simple array of addresses
            cJSON *addresses_array = cJSON_CreateArray();

            const char *addr_A = get_address_by_index(A);
            const char *addr_B = get_address_by_index(B);
            const char *addr_C = get_address_by_index(C);

            cJSON_AddItemToArray(addresses_array, cJSON_CreateString(addr_A ? addr_A : "unknown"));
            cJSON_AddItemToArray(addresses_array, cJSON_CreateString(addr_B ? addr_B : "unknown"));
            cJSON_AddItemToArray(addresses_array, cJSON_CreateString(addr_C ? addr_C : "unknown"));

            cJSON_AddItemToArray(json_output, addresses_array);
        }
    }
    fwrite(&end, sizeof(int), 1, fout);
    fclose(fout);

    // Write JSON output to file
    FILE *json_file = fopen("data/2_pools_filtered_aave.json", "w");
    char *json_string = cJSON_Print(json_output);
    fprintf(json_file, "%s", json_string);
    fclose(json_file);
    free(json_string);
    cJSON_Delete(json_output);
    printf("Total combs after AAVE filter : %d", filtered_count);
    free(aave_indexes);
    cJSON_Delete(tokens_array);

    return 0;
}
