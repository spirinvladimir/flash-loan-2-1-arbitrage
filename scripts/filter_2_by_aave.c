#include <float.h>
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <inttypes.h>
#include <string.h>

#define PROGRESS(curr, total) do { \
    int p = (curr * 40) / total; \
    printf("\r[%.*s%*s] %d%%", p, "########################################", 40-p, "", (curr*100)/total); \
    fflush(stdout); \
} while(0)

#define POOLS_COUNT 452063

int token0[POOLS_COUNT];
int token1[POOLS_COUNT];

int end = -1;

int is_aave(int token_index) {
    // AAVE token indices - These addresses were not found in tokens.json
    // You need to update this with correct token indices
    // Listed addresses (appear to be Sepolia testnet):
    // 0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357
    // 0xf8Fb3713D459D7C1018BD0A49D19b4C44290EBE5
    // 0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8
    // 0x29f2D40B0605204364af54EC677bD022dA425d03
    // 0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c
    // 0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0
    // 0x88541670E55cC00bEEFD87eB59EDd1b7C511AC9a
    // 0x6d906e526a4e2Ca02097BA9d0caA3c382F52278E
    // 0xc4bF5CbDaBE595361438F8c6a187bDc330539c60

    // Placeholder array - UPDATE with correct indices when available
    int aave_indices[] = {-1};  // -1 is sentinel value

    for (int i = 0; aave_indices[i] != -1; i++) {
        if (token_index == aave_indices[i]) {
            return 1;
        }
    }
    return 0;
}

int main() {


    printf("Loading pools and it's tokens\n");
    FILE* file = fopen("p2tt_452063.bin", "rb");
    int it;
    int ip;
    int max_it = 0;
    for (ip = 0; ip < POOLS_COUNT; ip++) {
        int _[2];
        size_t items_read = fread(_, sizeof(int32_t), 2, file);
        token0[ip] = _[0];
        token1[ip] = _[1];
        if (token0[ip] > max_it) max_it = token0[ip];
        if (token1[ip] > max_it) max_it = token1[ip];
        PROGRESS(ip, POOLS_COUNT);
    }
    PROGRESS(POOLS_COUNT, POOLS_COUNT);
    fclose(file);


    FILE *f3 = fopen("2_pools.bin", "rb");
    fseek(f3, 0, SEEK_END);
    long f3_size = ftell(file);
    int total = f3_size / (3 * sizeof(int));
    fseek(f3, 0, SEEK_SET);
    int (*combs3)[3] = malloc(total * sizeof(int[3]));
    fread(combs3, sizeof(int[3]), total, f3);
    fclose(f3);
    int aave_count = 0;
    FILE *faave = fopen("2_pools_filtered_aave.bin", "wb");
    for (int i = 0; i < total - 1; i++) {
        int A = combs3[i][0];
        int B = combs3[i][1];
        int C = combs3[i][2];

        if (is_aave(A) || is_aave(C)) {
            aave_count++;
            fwrite(&A, sizeof(int), 1, faave);
            fwrite(&B, sizeof(int), 1, faave);
            fwrite(&C, sizeof(int), 1, faave);
        }
    }
    fwrite(&end, sizeof(int), 1, faave);
    fclose(faave);
    printf("Total combs after AAVE filter : %d", aave_count);

    return 0;
}
